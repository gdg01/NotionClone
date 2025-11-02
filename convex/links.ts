// convex/links.ts (NUOVO FILE)

import { v } from "convex/values";
import { internalMutation, internalAction, query, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Tipo helper per i link estratti
type LinkInfo = {
  targetPageId: Id<"pages">;
  targetBlockId?: string;
  snippet: string;
};

// Funzione helper ricorsiva per trovare tutti i link in un documento JSON
function extractLinks(node: any): LinkInfo[] {
  let links: LinkInfo[] = [];

  // Caso 1: È un PageLink
  if (node.type === 'pageLink' && node.attrs?.pageId) {
    links.push({
      targetPageId: node.attrs.pageId,
      // Usiamo il testo del link come snippet, o "Untitled"
      snippet: node.content?.[0]?.text || "Untitled PageLink",
    });
  }

  // --- MODIFICA: Aggiorna il Caso 2 (BlockLink) ---
  if (node.type === 'blockLink' && node.attrs?.pageId && node.attrs?.blockId) {
    links.push({
      targetPageId: node.attrs.pageId,
      targetBlockId: node.attrs.blockId,
      
      // Usa l'alias personalizzato se esiste, altrimenti il fallback
      snippet: node.attrs.customAlias || "Link a un blocco", 
    });
  }
  // --- FINE MODIFICA ---

  // Scansione ricorsiva dei figli
  if (node.content && Array.isArray(node.content)) {
    for (const childNode of node.content) {
      links = links.concat(extractLinks(childNode));
    }
  }

  return links;
}

// -------------------------------------------------
// --- AZIONE PRINCIPALE DI INDICIZZAZIONE (INTERNA) ---
// -------------------------------------------------

// Helper per confrontare i link
const isSameLink = (a: LinkInfo, b: Doc<"backlinks">) => {
  return a.targetPageId === b.targetPageId &&
         (a.targetBlockId || null) === (b.targetBlockId || null);
};

export const updatePageLinks = internalAction({
  args: {
    pageId: v.id("pages"),
    contentJson: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { pageId, contentJson, userId } = args;

    // 1. Prendi lo stato ATTUALE dal DB
    const oldLinks = await ctx.runQuery(internal.links.getLinksFromSource, { pageId, userId });

    // 2. Calcola lo stato DESIDERATO dal JSON
    let content;
    try {
      content = JSON.parse(contentJson);
    } catch (e) {
      console.error("Errore parsing JSON per link-indexing:", e);
      return;
    }
    const newLinks = extractLinks(content);
    
    // --- CONFRONTO (Il "Delta") ---

    // 3. Trova i link DA RIMUOVERE
    // (Sono in 'oldLinks' ma NON in 'newLinks')
    const linksToRemove = oldLinks.filter(oldLink => 
      !newLinks.some(newLink => isSameLink(newLink, oldLink))
    );

    // 4. Trova i link DA AGGIUNGERE
    // (Sono in 'newLinks' ma NON in 'oldLinks')
    const linksToAdd = newLinks.filter(newLink =>
      !oldLinks.some(oldLink => isSameLink(newLink, oldLink))
    );
    
    // 5. Esegui solo le operazioni necessarie
    for (const link of linksToRemove) {
      await ctx.runMutation(internal.links.deleteBacklink, { linkId: link._id });
    }
    
    for (const link of linksToAdd) {
      await ctx.runMutation(internal.links.addBacklink, {
        userId: userId,
        sourcePageId: pageId,
        targetPageId: link.targetPageId,
        targetBlockId: link.targetBlockId,
        snippet: link.snippet, // (Potresti ottimizzare anche lo snippet qui)
      });
    }

    console.log(`[Backlinks Sostenibili] Pagina ${pageId}: ${linksToAdd.length} aggiunti, ${linksToRemove.length} rimossi.`);
  },
});


// -------------------------------------------------
// --- MUTAZIONI E QUERY HELPER (INTERNE) ---
// -------------------------------------------------

// Trova tutti i link creati DA una pagina (per pulirli)
export const getLinksFromSource = internalQuery({
  args: { pageId: v.id("pages"), userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("backlinks")
      .withIndex("by_source", q => q.eq("userId", args.userId).eq("sourcePageId", args.pageId))
      .collect();
  },
});

// Aggiunge un record di backlink
export const addBacklink = internalMutation({
  args: {
    userId: v.string(),
    sourcePageId: v.id("pages"),
    targetPageId: v.id("pages"),
    targetBlockId: v.optional(v.string()),
    snippet: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("backlinks", args);
  },
});

// Rimuove un record di backlink
export const deleteBacklink = internalMutation({
  args: { linkId: v.id("backlinks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.linkId);
  },
});

// -------------------------------------------------
// --- QUERY PUBBLICA PER IL FRONTEND ---
// -------------------------------------------------
export const getBacklinksForPage = query({
  args: {
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    // 1. Trova tutti i record di link che puntano a questa pagina
    const backlinks = await ctx.db
      .query("backlinks")
      .withIndex("by_target", q => q.eq("userId", userId).eq("targetPageId", args.pageId))
      .collect();

    if (backlinks.length === 0) {
      return [];
    }

    // 2. Estrarremo i metadati (titolo, icona) delle pagine sorgente
    const sourcePageIds = backlinks.map(b => b.sourcePageId);
    
    // 3. Interroga la tabella 'pages' per ottenere i metadati
    // (Usa una query interna se hai già 'getPagesByIds' in search.ts, 
    // altrimenti implementa una logica simile qui)
    
    // Per semplicità, la implementiamo qui:
    const sourcePages = await ctx.db
      .query("pages")
      .filter(q => q.or(...sourcePageIds.map(id => q.eq(q.field("_id"), id))))
      .collect();
      
    // 4. Crea una mappa per unire facilmente i dati
    const pagesMap = new Map(sourcePages.map(p => [p._id, { title: p.title, icon: p.icon }]));

    // 5. Arricchisci i risultati e restituiscili
    return backlinks.map(link => {
      const pageInfo = pagesMap.get(link.sourcePageId);
      return {
        _id: link._id,
        sourcePageId: link.sourcePageId,
        sourcePageTitle: pageInfo?.title || "Pagina non trovata",
        sourcePageIcon: pageInfo?.icon || "📄",
        snippet: link.snippet,
      };
    }).filter(b => b.sourcePageTitle !== "Pagina non trovata");
  },
});

// convex/links.ts (AGGIUNGI)

export const backfillAllLinks = internalAction({
  handler: async (ctx) => {
    console.log("[Backfill Links] Avvio indicizzazione di tutti i link...");

    // 1. Cancella tutti i link esistenti per evitare duplicati
    const allLinks = await ctx.db.query("backlinks").collect();
    for (const link of allLinks) {
      await ctx.runMutation(internal.links.deleteBacklink, { linkId: link._id });
    }
    console.log(`[Backfill Links] Cancellati ${allLinks.length} vecchi link.`);

    // 2. Prendi tutti i contenuti delle pagine
    const allPageContents = await ctx.runQuery(internal.search.getAllPageContents);

    // 3. Per ogni pagina, schedula un lavoro di indicizzazione
    for (const pageContent of allPageContents) {
      const page = await ctx.runQuery(api.pages.getPage, { pageId: pageContent.pageId }); // Assumi di avere una query 'getPage'
      if (page && pageContent.content && !page.isArchived) {
        await ctx.runAction(internal.links.updatePageLinks, {
          pageId: pageContent.pageId,
          contentJson: pageContent.content,
          userId: page.userId,
        });
      }
    }

    const result = `[Backfill Links] ✅ Aggiunti ${allPageContents.length} lavori alla coda.`;
    console.log(result);
    return result;
  }
});