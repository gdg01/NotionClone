// File: convex/pages.ts (SOSTITUZIONE COMPLETA con CODA)
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { applyPatch } from "fast-json-patch";
import { internal } from "./_generated/api"; 
import { customAlphabet } from "nanoid";
// 1. 'getSidebar' (invariato)
export const getSidebar = query({
  args: { 
    parentPage: v.optional(v.id("pages")) 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { return []; }
    const userId = identity.subject;

    // 1. Trova le pagine a questo livello (come prima)
    const pages = await ctx.db
      .query("pages")
      .withIndex("byUserAndParent", (q) => 
        q.eq("userId", userId)
         .eq("parentId", args.parentPage)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("asc") 
      .collect();

    // --- NUOVA AGGIUNTA ---
    // 2. Per ogni pagina trovata, controlla se *essa* ha figli
    const pagesWithChildrenFlag = await Promise.all(
      pages.map(async (page) => {
        
        // Cerca un *singolo* figlio non archiviato per questa pagina
        const firstChild = await ctx.db
          .query("pages")
          .withIndex("byUserAndParent", (q) => 
            q.eq("userId", userId)
             .eq("parentId", page._id) // Controlla i figli di 'page'
          )
          .filter((q) => q.eq(q.field("isArchived"), false))
          .first(); // .first() è molto efficiente

        // 3. Restituisci la pagina originale + il nuovo flag
        return {
          ...page, // ...tutti i campi di 'page' (id, title, icon, etc.)
          hasChildren: firstChild !== null, // Aggiungi il flag
        };
      })
    );
    // --- FINE NUOVA AGGIUNTA ---

    return pagesWithChildrenFlag;
  },
});

// 2. 'getAllMetadata' (invariato)
export const getAllMetadata = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { return []; }
    const userId = identity.subject;
    const pages = await ctx.db.query("pages").withIndex("byUser", (q) => q.eq("userId", userId))
      .order("desc").collect();
    return pages;
  },
});


// 3. 'getContent' (invariato)
export const getContent = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { throw new Error("Not authenticated"); }
    const contentDoc = await ctx.db.query("pageContent")
      .withIndex("byPageId", (q) => q.eq("pageId", args.pageId)).unique();
    return contentDoc?.content || ""; 
  },
});

// 4. 'create' (invariato)
export const create = mutation({
  args: { title: v.string(), parentPage: v.optional(v.id("pages")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { throw new Error("Not authenticated"); }
    const userId = identity.subject;

    // --- INIZIO NUOVA LOGICA EREDITARIETÀ TAG ---
    let tagsToInherit: string[] = [];
    
    if (args.parentPage) {
      // C'è un genitore, proviamo a caricarlo
      const parentPage = await ctx.db.get(args.parentPage);
      
      // Controlliamo che esista, che sia dello stesso utente e che abbia dei tag
      if (parentPage && 
          parentPage.userId === userId && 
          parentPage.tags && 
          parentPage.tags.length > 0) 
      {
        // Eredita il *primo* tag
        tagsToInherit = [parentPage.tags[0]]; 
      }
    }
    // --- FINE NUOVA LOGICA EREDITARIETÀ TAG ---

    const pageId = await ctx.db.insert("pages", {
      title: args.title,
      userId,
      icon: "",
      parentId: args.parentPage,
      isArchived: false,
      coverImage: undefined,
      tags: tagsToInherit, // <-- USA LA NUOVA VARIABILE
      isPinned: false,
      properties: {},
    });

    await ctx.db.insert("pageContent", {
      pageId: pageId, content: "{}",
    });
    
    return pageId;
  },
});


// 5.a 'update' (MODIFICATO)
export const update = mutation({
    args: {
        id: v.id("pages"), 
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        icon: v.optional(v.string()),
        // --- AGGIUNGI I NUOVI CAMPI QUI ---
        coverImage: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        isPinned: v.optional(v.boolean()),
        properties: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        const userId = identity.subject;
        const { id, content, ...metadata } = args; 
        const existingPage = await ctx.db.get(id);
        if (!existingPage) throw new Error("Not found");
        if (existingPage.userId !== userId) throw new Error("Unauthorized");

        if (Object.keys(metadata).length > 0) {
            await ctx.db.patch(id, metadata);
        }

        if (content !== undefined) {
            const contentDoc = await ctx.db
               .query("pageContent").withIndex("byPageId", q => q.eq("pageId", id)).unique();
            if (contentDoc) {
                await ctx.db.patch(contentDoc._id, { content });
            } else {
                await ctx.db.insert("pageContent", { pageId: id, content });
            }

            // 1. Lavoro di Embedding (già presente)
            await ctx.runMutation(internal.search.enqueueEmbeddingJob, {
                pageId: id,
                contentJson: content
            });
            
            // --- MODIFICA DA AGGIUNGERE ---
            // 2. NUOVO: Lavoro di Indicizzazione Link
            await ctx.scheduler.runAfter(0, internal.links.updatePageLinks, {
                pageId: id,
                contentJson: content,
                userId: userId // Passa l'ID utente
            });
            // --- FINE MODIFICA ---
        }
        return await ctx.db.get(id); 
    },
});

// 5.b 'patchContent' (MODIFICATO)
export const patchContent = mutation({
    args: {
        id: v.id("pages"),
        patch: v.string(), 
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        const userId = identity.subject;
        const { id, patch: patchString } = args;
        const existingPage = await ctx.db.get(id);
        if (!existingPage) throw new Error("Not found");
        if (existingPage.userId !== userId) throw new Error("Unauthorized");
        const contentDoc = await ctx.db
           .query("pageContent").withIndex("byPageId", q => q.eq("pageId", id)).unique();
        if (!contentDoc) {
            await ctx.db.insert("pageContent", { pageId: id, content: "{}" });
            return;
        }

        let newContentJSON;
        try {
            const oldContentJSON = JSON.parse(contentDoc.content || "{}");
            const patchJSON = JSON.parse(patchString);
            const { newDocument } = applyPatch(oldContentJSON, patchJSON);
            newContentJSON = newDocument;
            
            const newContentString = JSON.stringify(newContentJSON); // Salva la stringa
            
            await ctx.db.patch(contentDoc._id, { 
                content: newContentString 
            });

            // 1. Lavoro di Embedding (già presente)
            await ctx.runMutation(internal.search.enqueueEmbeddingJob, {
                pageId: id,
                contentJson: newContentString // Usa la stringa
            });

            // --- MODIFICA DA AGGIUNGERE ---
            // 2. NUOVO: Lavoro di Indicizzazione Link
            await ctx.scheduler.runAfter(0, internal.links.updatePageLinks, {
                pageId: id,
                contentJson: newContentString, // Usa la stringa
                userId: userId // Passa l'ID utente
            });
            // --- FINE MODIFICA ---

        } catch (e) {
            console.error("Applicazione patch fallita:", e);
            throw new Error("Failed to apply patch.");
        }
    },
});

// 6. 'archive' (invariato)
export const archive = mutation({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    // ... (codice invariato) ...
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const existingPage = await ctx.db.get(args.id);
    if (!existingPage) throw new Error("Not found");
    if (existingPage.userId !== userId) throw new Error("Unauthorized");
    const recursiveArchive = async (pageId: Id<"pages">) => {
        const children = await ctx.db.query("pages").withIndex("byUser", q => q.eq("userId", userId))
            .filter(q => q.eq(q.field("parentId"), pageId)).collect();
        for (const child of children) {
             await ctx.db.patch(child._id, { isArchived: true });
            await recursiveArchive(child._id);
        }
    }
    const page = await ctx.db.patch(args.id, { isArchived: true });
    recursiveArchive(args.id); 
    return page;
  }
});

export const togglePublicAccess = mutation({
  args: {
    id: v.id("pages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = identity.subject;
    const existingPage = await ctx.db.get(args.id);
    if (!existingPage) throw new Error("Not found");
    if (existingPage.userId !== userId) throw new Error("Unauthorized");

    // Se sta per diventare pubblico, genera un shareId
    if (!existingPage.isPublic) {
      // Genera un ID unico e non indovinabile
      const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);
      const shareId = nanoid();
      
      await ctx.db.patch(args.id, {
        isPublic: true,
        shareId: shareId,
      });
      return shareId;
    } else {
      // Se sta per diventare privato, rimuovi lo shareId
      await ctx.db.patch(args.id, {
        isPublic: false,
        shareId: undefined,
      });
      return null;
    }
  },
});

// --- NUOVA QUERY PUBBLICA PER RECUPERARE I DATI ---
// Nota: questa è 'query' e non 'internalQuery' e NON controlla l'identità.
export const getPublicPageData = query({
  args: {
    shareId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Trova la pagina (metadati) usando l'indice
    const page = await ctx.db
      .query("pages")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .filter((q) => q.eq(q.field("isPublic"), true)) // Assicurati che sia pubblica
      .unique();

    if (!page) {
      return null;
    }

    // 2. Trova il contenuto della pagina
    const contentDoc = await ctx.db
      .query("pageContent")
      .withIndex("byPageId", (q) => q.eq("pageId", page._id))
      .unique();

    // 3. Trova i metadati delle sottopagine (per il componente SubPagesList)
    const subPages = await ctx.db
      .query("pages")
      .withIndex("byUserAndParent", (q) =>
        q.eq("userId", page.userId).eq("parentId", page._id)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("asc")
      .collect();

    // 4. Restituisci tutto il necessario per il render
    return {
      page: page, // metadati della pagina
      content: contentDoc?.content || "{}", // contenuto JSON
      subPages: subPages, // metadati delle sottopagine
    };
  },
});
