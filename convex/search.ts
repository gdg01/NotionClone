// File: convex/search.ts
// (SOSTITUZIONE COMPLETA - Adattata allo schema a 2 tabelle)

import { v } from "convex/values";
import { 
  action, 
  query, 
  internalAction, 
  internalQuery, 
  internalMutation 
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// --- Variabili d'ambiente ---
const serperApiKey = process.env.SERPER_API_KEY;
const hfApiKey = process.env.HUGGINGFACE_API_KEY;
const googleApiKey = process.env.GEMINI_API_KEY; 

// --- Funzioni helper ---
type EmbedInputType = "query" | "document";
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 'embed' ora è una internalAction
export const embed = internalAction({
  args: {
    text: v.string(),
    inputType: v.union(v.literal("query"), v.literal("document")),
  },
  handler: async (ctx, args) => {
    const { text, inputType } = args;
    if (!text?.trim()) return [];
    if (!googleApiKey) {
      console.error("GOOGLE_API_KEY non configurata!");
      throw new Error("GOOGLE_API_KEY non configurata");
    }
    const taskType = inputType === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${googleApiKey}`;
    const body = JSON.stringify({
      content: { parts: [{ text: text }] },
      taskType: taskType
    });
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(`Errore API Google (${response.status}): ${errorData.error?.message || response.statusText}`);
        }
        const result = await response.json();
        if (!result.embedding?.values) { throw new Error("Risposta API non valida, embedding mancante."); }
        console.log(`[Google REST] Embedding generato: ${result.embedding.values.length} dim`);
        return result.embedding.values;
      } catch (e: any) {
        console.error(`Tentativo ${attempt} fallito:`, e?.message);
        if (attempt === 3) throw e;
        await wait(1500); 
      }
    }
    throw new Error("Embedding fallito dopo 3 tentativi");
  },
});

const searchWeb = async (query: string) => {
  if (!serperApiKey) { console.warn("SERPER_API_KEY non configurata"); return []; }
  try {
    const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": serperApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, num: 5 })
    });
    if (!response.ok) { throw new Error(`Errore API Serper: ${response.statusText}`); }
    const data = await response.json();
    return data.organic?.map((res: any) => ({
      url: res.link, source_title: res.title, snippet: res.snippet,
    })) || [];
  } catch (err) { console.error("Errore ricerca Serper:", err); return []; }
};

const extractSection = (text: string, tag: string, nextTag?: string): string => {
  try {
    let content = text.split(`[${tag}]:`)[1];
    if (!content) return "";
    
    if (nextTag) {
      content = content.split(`[${nextTag}]:`)[0];
    }
    
    return content.trim();
  } catch (e) {
    console.error(`Errore nel parsing del tag ${tag}:`, e);
    return "";
  }
};

// --- AZIONE PRINCIPALE DI RICERCA ---
export const performContextualSearch = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    
    // --- INIZIO MODIFICA ---
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.warn("[Search] Utente non autenticato.");
      // Restituisci un risultato coerente per l'utente non loggato
      return {
        combinedSummary: "Devi essere autenticato per usare la ricerca interna.",
        internalSummary: "Devi essere autenticato per usare la ricerca interna.",
        externalSummary: "", // La ricerca esterna potrebbe ancora funzionare se vuoi
        internal: [],
        external: [] // Puoi scegliere di eseguire comunque searchWeb(args.query)
      };
    }
    const userId = identity.subject;
    console.log(`[Search] Ricerca per: "${args.query}" (Utente: ${userId})`);
    // --- FINE MODIFICA ---

    const queryEmbedding = await ctx.runAction(internal.search.embed, { 
      text: args.query, 
      inputType: "document" 
    });
    
    const [internalResults, externalResults] = await Promise.all([
        ctx.runAction(internal.search.searchInternal, { 
          queryEmbedding: queryEmbedding,
          userId: userId // <-- PASSA LO userId
        }),
        searchWeb(args.query)
    ]);
    console.log(`[Search] Ricevuti ${internalResults.length} risultati interni e ${externalResults.length} esterni.`);

    const internalContext = internalResults
      .map(res => `Titolo Pagina: ${res.pageTitle}\nContenuto: ${res.textPreview}`)
      .join("\n\n---\n\n");
    const externalContext = externalResults
      .map(res => `Sito: ${res.source_title}\nContenuto: ${res.snippet}`)
      .join("\n\n---\n\n");
      
    const oneShotPrompt = `
    Sei un assistente di ricerca. La domanda dell'utente è: "${args.query}"
    ${internalContext.length > 0 ? `
    --- INIZIO: Le mie note ---
    ${internalContext}
    --- FINE: Le mie note ---` : ''}
    ${externalContext.length > 0 ? `
    --- INIZIO: Dal Web ---
    ${externalContext}
    --- FINE: Dal Web ---` : ''}
    ISTRUZIONI IMPORTANTI:
    Devi generare tre riassunti separati basandoti ESCLUSIVAMENTE sulle fonti fornite.
    Formatta la tua risposta ESATTAMENTE come segue, usando i delimitatori speciali. Non aggiungere nient'altro prima o dopo i tag.
    [INTERNAL SUMMARY]:
(Scrivi qui la tua sintesi basata *solo* su "Le mie note". Se non ci sono note pertinenti, scrivi "Nessuna informazione trovata nelle tue note.")
    [EXTERNAL SUMMARY]:
(Scrivi qui la tua sintesi basata *solo* su "Dal Web". Se non ci sono fonti web pertinenti, scrivi "Nessuna informazione trovata sul web.")
    [COMBINED SUMMARY]:
(Scrivi qui la tua sintesi combinata che unisce le informazioni da *entrambe* le fonti. Se non hai trovato nulla, scrivi "Nessun risultato trovato.")
    `;
    const aiResponse = await ctx.runAction(api.ai.askGroq, {
      history: [{ role: "user", content: oneShotPrompt }]
    });
    const internalSummary = extractSection(aiResponse, "INTERNAL SUMMARY", "EXTERNAL SUMMARY");
    const externalSummary = extractSection(aiResponse, "EXTERNAL SUMMARY", "COMBINED SUMMARY");
    const combinedSummary = extractSection(aiResponse, "COMBINED SUMMARY");
    if (!internalSummary && !externalSummary && !combinedSummary && aiResponse.length > 10) {
        return {
            combinedSummary: aiResponse, internalSummary: "", externalSummary: "",
            internal: internalResults, external: externalResults
        };
    }
    return {
      combinedSummary, internalSummary, externalSummary,
      internal: internalResults, external: externalResults
    };
  },
});

// ============================================
// FUNZIONE searchInternal - VERSIONE COMPLETA
// ============================================
// Sostituisci completamente la funzione searchInternal nel tuo search.ts

export const searchInternal = action({
  args: { queryEmbedding: v.array(v.float64()), userId: v.string()},
  handler: async (ctx, args) => {
    console.log(`[Search Internal] Inizio ricerca per userId: ${args.userId}`);
    
    if (args.queryEmbedding.length === 0) { 
      console.warn("[Search Internal] Embedding vuoto, skip ricerca"); 
      return []; 
    }
    
    // 1. Cerca nella tabella PESANTE 'blockEmbeddings'
    // NOTA: vectorSearch restituisce solo _id e _score, non i campi custom
    const searchResults = await ctx.vectorSearch("blockEmbeddings", "by_embedding", { 
        vector: args.queryEmbedding, 
        limit: 10
    });
    
    console.log(`[Search Internal] vectorSearch ha restituito ${searchResults.length} risultati.`);
    
    if (searchResults.length === 0) {
      console.warn("[Search Internal] Nessun risultato dalla vectorSearch");
      return [];
    }
    
    // 2. Recupera i documenti COMPLETI dalla tabella blockEmbeddings usando gli _id
    const embeddingIds = searchResults.map(r => r._id);
    const fullEmbeddings = await ctx.runQuery(internal.search.getEmbeddingsByIds, { 
      ids: embeddingIds 
    });
    
    console.log(`[Search Internal] Recuperati ${fullEmbeddings.length} embedding completi`);
    
    // 3. Crea una mappa score -> embedding _id
    const scoreMap = new Map(searchResults.map(res => [res._id, res._score]));
    
    // 4. Estrai pageIds e blockIds dai documenti COMPLETI
    const pageIds = [...new Set(
      fullEmbeddings
        .map(emb => emb.pageId)
        .filter((id): id is Id<"pages"> => id !== undefined && id !== null)
    )];

    const blockIds = fullEmbeddings
      .map(emb => emb.blockId)
      .filter((id): id is string => id !== undefined && id !== null && id !== "");

    console.log(`[Search Internal] Recupero dati per ${pageIds.length} pagine e ${blockIds.length} blocchi`);

    // 5. Recupera i metadati (Pagine e Testo) in parallelo
    const [pages, textBlocks] = await Promise.all([
      ctx.runQuery(internal.search.getPagesByIds, { ids: pageIds }),
      ctx.runQuery(internal.search.getTextBlocksByBlockIds, { blockIds: blockIds })
    ]);
    
    console.log(`[Search Internal] Ricevute ${pages.length} pagine e ${textBlocks.length} textBlocks`);
    
    // 6. Crea mappe per lookup veloce
    const pageMap = new Map(pages.map((p) => [p._id, { title: p.title, icon: p.icon, userId: p.userId }]));
    const textMap = new Map(textBlocks.map((b) => [b.blockId, b.text]));
    const embeddingMap = new Map(fullEmbeddings.map(e => [e._id, e]));

    // 7. Unisci i risultati e filtra per userId
    const finalResults = searchResults
      .map((result) => {
        const embDoc = embeddingMap.get(result._id);
        if (!embDoc) {
          console.warn(`[Search Internal] Embedding non trovato per _id: ${result._id}`);
          return null;
        }
        
        const pageInfo = pageMap.get(embDoc.pageId);
        const textPreview = textMap.get(embDoc.blockId);
        
        if (!pageInfo || !textPreview) {
          console.warn(`[Search Internal] Dati mancanti per blockId: ${embDoc.blockId}`);
          return null;
        }

        // IMPORTANTE: Filtra per userId
        if (pageInfo.userId !== args.userId) {
          console.log(`[Search Internal] Pagina ${embDoc.pageId} appartiene a un altro utente, skip`);
          return null;
        }

        return {
          _id: embDoc.pageId,
          blockId: embDoc.blockId,
          score: scoreMap.get(result._id) || 0,
          textPreview: textPreview,
          pageTitle: pageInfo.title || "Pagina non trovata",
          pageIcon: pageInfo.icon || "📄",
        };
      })
      .filter((res): res is NonNullable<typeof res> => res !== null)
      .filter((res) => {
        const passThreshold = res.score > 0.6;
        if (!passThreshold) {
          console.log(`[Search Internal] Scartato risultato con score ${res.score} (soglia: 0.25)`);
        }
        return passThreshold;
      })
      .sort((a, b) => b.score - a.score);

    console.log(`[Search Internal] Risultati finali elaborati: ${finalResults.length}`);
    
    if (finalResults.length > 0) {
      console.log(`[Search Internal] Top risultato: score=${finalResults[0].score}, title="${finalResults[0].pageTitle}"`);
    }
    
    return finalResults;
  },
});

// ============================================
// HELPER FUNCTIONS NECESSARIE
// ============================================
// Aggiungi anche queste se non le hai già

// Recupera embeddings completi per ID
export const getEmbeddingsByIds = internalQuery({
  args: { ids: v.array(v.id("blockEmbeddings")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) return [];
    
    const embeddings = await Promise.all(
      args.ids.map(id => ctx.db.get(id))
    );
    
    return embeddings.filter((e): e is Doc<"blockEmbeddings"> => e !== null);
  },
});

// Recupera textBlocks per blockIds (gestisce duplicati con .first())
export const getTextBlocksByBlockIds = internalQuery({
  args: { blockIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (args.blockIds.length === 0) {
      return [];
    }

    // Usa .first() invece di .unique() per gestire eventuali duplicati
    const blocks = await Promise.all(
      args.blockIds.map(blockId => 
        ctx.db.query("textBlocks")
          .withIndex("by_blockId", q => q.eq("blockId", blockId))
          .first()
      )
    );
    
    const foundBlocks = blocks.filter((b): b is Doc<"textBlocks"> => b !== null);
    
    console.log(`[getTextBlocksByBlockIds] Richiesti ${args.blockIds.length} ID, trovati ${foundBlocks.length} blocchi.`);
    
    return foundBlocks;
  },
});

// Recupera pagine per IDs (dovrebbe già esistere)
export const getPagesByIds = internalQuery({
  args: { ids: v.array(v.id("pages")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) return [];
    
    const pages = await Promise.all(
      args.ids.map(id => ctx.db.get(id))
    );
    
    return pages.filter((p): p is Doc<"pages"> => p !== null);
  },
});

// --- LOGICA DI INDICIZZAZIONE (Query e Mutazioni per lo schema a 2 tabelle) ---

// Legge dalla tabella LEGGERA 'textBlocks'
export const getBlocksForPage = internalQuery({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => { 
    const blocks = await ctx.db
      .query("textBlocks")
      .withIndex("by_pageId", q => q.eq("pageId", args.pageId))
      .collect();
      
    // Proiezione: restituisci solo i dati minimi necessari per il confronto
    return blocks.map(block => ({
      _id: block._id,
      blockId: block.blockId,
      contentHash: block.contentHash,
    }));
  },
});

// Legge dalla tabella PESANTE 'blockEmbeddings'
export const getEmbeddingsForPage = internalQuery({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const embeddings = await ctx.db
      .query("blockEmbeddings")
      .withIndex("by_pageId_blockId", q => q.eq("pageId", args.pageId))
      .collect();
    
    // Restituisce solo i campi necessari per la pulizia
    return embeddings.map(emb => ({
      _id: emb._id,
      blockId: emb.blockId,
    }));
  }
});

// --- Nuove mutazioni per le 2 tabelle ---
export const insertTextBlock = internalMutation({
  args: { 
    pageId: v.id("pages"), 
    blockId: v.string(), 
    text: v.string(), 
    contentHash: v.string(), 
  },
  handler: async (ctx, args) => { 
    await ctx.db.insert("textBlocks", {
      pageId: args.pageId,
      blockId: args.blockId,
      text: args.text,
      contentHash: args.contentHash, 
    }); 
  },
});

export const insertBlockEmbedding = internalMutation({
  args: {
    pageId: v.id("pages"),
    blockId: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("blockEmbeddings", {
      pageId: args.pageId,
      blockId: args.blockId,
      embedding: args.embedding,
    });
  }
});

export const updateTextBlock = internalMutation({
  args: {
    textBlockId: v.id("textBlocks"),
    text: v.string(),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.textBlockId, {
      text: args.text,
      contentHash: args.contentHash,
    });
  }
});

export const deleteTextBlock = internalMutation({
  args: { textBlockId: v.id("textBlocks") },
  handler: async (ctx, args) => { 
    await ctx.db.delete(args.textBlockId); 
  },
});

export const deleteBlockEmbedding = internalMutation({
  args: { embeddingId: v.id("blockEmbeddings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.embeddingId);
  }
});

// --- GESTIONE CODA (MODIFICATA) ---
export const enqueueEmbeddingJob = internalMutation({
  args: {
    pageId: v.id("pages"),
    contentJson: v.string(),
  },
  handler: async (ctx, args) => {
    // IMPORTANTE: Cancella i job esistenti E segna la pagina come "in lavorazione"
    const existing = await ctx.db
      .query("embeddingQueue")
      .filter(q => q.eq(q.field("pageId"), args.pageId))
      .collect();
      
    // Cancella job duplicati
    for (const job of existing) {
      await ctx.db.delete(job._id);
    }
    
    // Inserisci il nuovo job
    await ctx.db.insert("embeddingQueue", {
      pageId: args.pageId,
      contentJson: args.contentJson,
    });

    console.log(`[Queue] Accodato lavoro per pagina: ${args.pageId} (rimossi ${existing.length} job duplicati)`);
    
    // Schedula il worker SOLO se non è già in esecuzione
    // NOTA: Questo previene scheduling multipli
    await ctx.scheduler.runAfter(0, internal.searchNode.processEmbeddingQueue, {});
  }
});

// ============================================
// 2. CORREZIONE IN search.ts - Nuove mutazioni UPSERT
// ============================================
// Aggiungi queste nuove funzioni per gestire l'upsert:

export const upsertTextBlock = internalMutation({
  args: { 
    pageId: v.id("pages"), 
    blockId: v.string(), 
    text: v.string(), 
    contentHash: v.string(), 
  },
  handler: async (ctx, args) => {
    // Cerca se esiste già
    const existing = await ctx.db
      .query("textBlocks")
      .withIndex("by_blockId", q => q.eq("blockId", args.blockId))
      .first();
    
    if (existing) {
      // Aggiorna
      await ctx.db.patch(existing._id, {
        text: args.text,
        contentHash: args.contentHash,
        pageId: args.pageId, // Aggiorna anche pageId per sicurezza
      });
      console.log(`[Upsert] Aggiornato textBlock: ${args.blockId}`);
    } else {
      // Inserisci nuovo
      await ctx.db.insert("textBlocks", {
        pageId: args.pageId,
        blockId: args.blockId,
        text: args.text,
        contentHash: args.contentHash,
      });
      console.log(`[Upsert] Inserito nuovo textBlock: ${args.blockId}`);
    }
  },
});

export const upsertBlockEmbedding = internalMutation({
  args: {
    pageId: v.id("pages"),
    blockId: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    // Cerca se esiste già (usando indice composito)
    const existing = await ctx.db
      .query("blockEmbeddings")
      .withIndex("by_pageId_blockId", q => 
        q.eq("pageId", args.pageId).eq("blockId", args.blockId)
      )
      .first();
    
    if (existing) {
      // Aggiorna
      await ctx.db.patch(existing._id, {
        embedding: args.embedding,
      });
      console.log(`[Upsert] Aggiornato embedding: ${args.blockId}`);
    } else {
      // Inserisci nuovo
      await ctx.db.insert("blockEmbeddings", {
        pageId: args.pageId,
        blockId: args.blockId,
        embedding: args.embedding,
      });
      console.log(`[Upsert] Inserito nuovo embedding: ${args.blockId}`);
    }
  }
});

export const getNextQueueJob = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("embeddingQueue")
      .filter(q => 
        q.or(
          q.eq(q.field("processing"), false),
          q.eq(q.field("processing"), undefined)
        )
      )
      .order("asc")
      .first();
  }
});

// B) Aggiungi mutazione per MARCARE come "in lavorazione"
export const markJobAsProcessing = internalMutation({
  args: { jobId: v.id("embeddingQueue") },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.jobId, { 
      processing: true,
      processingStartedAt: now  // Per debug e timeout
    });
    console.log(`[Lock] Job ${args.jobId} marcato come in lavorazione`);
  }
});

// C) OPZIONALE: Funzione per sbloccare job "stuck"
// Utile se un worker crasha e lascia job bloccati
export const unlockStuckJobs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minuti
    const now = Date.now();
    
    const stuckJobs = await ctx.db
      .query("embeddingQueue")
      .filter(q => q.eq(q.field("processing"), true))
      .collect();
    
    let unlockedCount = 0;
    for (const job of stuckJobs) {
      // Controlla se il job è in elaborazione da più di 5 minuti
      if (job.processingStartedAt && (now - job.processingStartedAt) > TIMEOUT_MS) {
        await ctx.db.patch(job._id, { 
          processing: false,
          processingStartedAt: undefined
        });
        unlockedCount++;
        console.log(`[Lock] Sbloccato job stuck: ${job._id}`);
      }
    }
    
    return `Sbloccati ${unlockedCount} job`;
  }
});

export const deleteQueueJob = internalMutation({
  args: { jobId: v.id("embeddingQueue") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.jobId);
  }
});

// --- FUNZIONI DI BACKFILL (MODIFICATE) ---
export const getAllPageContents = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("pageContent").fullTableScan().collect();
  },
});

export const backfillAllPages = internalAction({
  args: {},
  handler: async (ctx, args) => {
    console.log("[Backfill] Inizio indicizzazione di tutte le pagine...");
    
    const allPageContents = await ctx.runQuery(internal.search.getAllPageContents);
    let count = 0;
    
    for (const page of allPageContents) {
      if (page.content) {
        count++;
        await ctx.runMutation(internal.search.enqueueEmbeddingJob, {
          pageId: page.pageId,
          contentJson: page.content
        });
      }
    }
    
    const result = `[Backfill] ✅ Aggiunti ${count} lavori alla coda di indicizzazione.`;
    console.log(result);
    return result;
  }
});

// Query helper per hashBlocks (legge anche il testo)
export const getAllBlocksWithText = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("textBlocks").collect();
  }
});

// Mutazione helper per hashBlocks
export const updateContentHash = internalMutation({
  args: {
    blockId: v.id("textBlocks"),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.blockId, { contentHash: args.contentHash });
  }
});

// Funzione di pulizia (MODIFICATA per 2 tabelle)
export const clearAndRebuild = internalAction({
  handler: async (ctx) => {
    console.log("[Clear] Cancellazione di tutti i textBlocks e blockEmbeddings...");
    
    const allBlocks = await ctx.runQuery(internal.search.getAllBlocks);
    const allEmbeddings = await ctx.runQuery(internal.search.getAllEmbeddings);
    
    for (const block of allBlocks) {
      await ctx.runMutation(internal.search.deleteTextBlock, { textBlockId: block._id });
    }
    for (const embedding of allEmbeddings) {
      await ctx.runMutation(internal.search.deleteBlockEmbedding, { embeddingId: embedding._id });
    }
    
    console.log(`[Clear] ✅ Cancellati ${allBlocks.length} blocchi e ${allEmbeddings.length} embedding.`);
    console.log("[Rebuild] Avvio re-indicizzazione...");
    
    const result = await ctx.runAction(internal.search.backfillAllPages, {});
    
    return {
      deletedBlocks: allBlocks.length,
      deletedEmbeddings: allEmbeddings.length,
      result: result
    };
  }
});

// Helper per clearAndRebuild
export const getAllBlocks = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("textBlocks").collect();
  }
});

// Helper per clearAndRebuild
export const getAllEmbeddings = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("blockEmbeddings").collect();
  }
});


// (Questa non è più usata da searchInternal, ma la lasciamo per ora)
export const getBlocksByIds = internalQuery({
  args: { ids: v.array(v.id("textBlocks")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) return [];
    return await ctx.db
      .query("textBlocks")
      .filter(q => q.or(...args.ids.map(id => q.eq(q.field("_id"), id))))
      .collect();
  },
});

export const getAllPageIdsForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Usa l'indice 'byUser' sulla tabella 'pages'
    const pages = await ctx.db
      .query("pages")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Restituisce solo gli ID
    return pages.map(p => p._id);
  },
});



export const cleanDuplicateBlocks = internalAction({
  handler: async (ctx) => {
    console.log("[Clean] Ricerca duplicati...");
    
    const allBlocks = await ctx.runQuery(internal.search.getAllBlocks);
    const seen = new Map<string, Id<"textBlocks">>();
    let deletedCount = 0;
    
    for (const block of allBlocks) {
      const key = `${block.pageId}-${block.blockId}`;
      
      if (seen.has(key)) {
        // È un duplicato, cancellalo
        await ctx.runMutation(internal.search.deleteTextBlock, { 
          textBlockId: block._id 
        });
        deletedCount++;
        console.log(`[Clean] Cancellato duplicato: ${block.blockId}`);
      } else {
        seen.set(key, block._id);
      }
    }
    
    return `[Clean] ✅ Cancellati ${deletedCount} duplicati`;
  }
});



// ============================================
// SCRIPT DI PULIZIA DUPLICATI
// ============================================
// Aggiungi temporaneamente al tuo search.ts

// 1. Pulisce i duplicati da textBlocks
export const cleanDuplicateTextBlocks = internalAction({
  handler: async (ctx) => {
    console.log("[Clean TextBlocks] 🔍 Ricerca duplicati in textBlocks...");
    
    const allBlocks = await ctx.runQuery(internal.search.getAllBlocks);
    console.log(`[Clean TextBlocks] Trovati ${allBlocks.length} blocchi totali`);
    
    // Mappa: "pageId-blockId" -> primo documento trovato
    const seen = new Map<string, Id<"textBlocks">>();
    const toDelete: Id<"textBlocks">[] = [];
    
    for (const block of allBlocks) {
      const key = `${block.pageId}-${block.blockId}`;
      
      if (seen.has(key)) {
        // È un duplicato, segnalo per cancellazione
        toDelete.push(block._id);
        console.log(`[Clean TextBlocks] Duplicato trovato: blockId=${block.blockId}`);
      } else {
        seen.set(key, block._id);
      }
    }
    
    console.log(`[Clean TextBlocks] Trovati ${toDelete.length} duplicati da cancellare`);
    
    // Cancella i duplicati
    for (const id of toDelete) {
      await ctx.runMutation(internal.search.deleteTextBlock, { textBlockId: id });
    }
    
    const result = `[Clean TextBlocks] ✅ Cancellati ${toDelete.length} duplicati su ${allBlocks.length} blocchi totali`;
    console.log(result);
    return result;
  }
});

// 2. Pulisce i duplicati da blockEmbeddings
export const cleanDuplicateEmbeddings = internalAction({
  handler: async (ctx) => {
    console.log("[Clean Embeddings] 🔍 Ricerca duplicati in blockEmbeddings...");
    
    const allEmbeddings = await ctx.runQuery(internal.search.getAllEmbeddings);
    console.log(`[Clean Embeddings] Trovati ${allEmbeddings.length} embeddings totali`);
    
    // Mappa: "pageId-blockId" -> primo documento trovato
    const seen = new Map<string, Id<"blockEmbeddings">>();
    const toDelete: Id<"blockEmbeddings">[] = [];
    
    for (const embedding of allEmbeddings) {
      const key = `${embedding.pageId}-${embedding.blockId}`;
      
      if (seen.has(key)) {
        // È un duplicato, segnalo per cancellazione
        toDelete.push(embedding._id);
        console.log(`[Clean Embeddings] Duplicato trovato: blockId=${embedding.blockId}`);
      } else {
        seen.set(key, embedding._id);
      }
    }
    
    console.log(`[Clean Embeddings] Trovati ${toDelete.length} duplicati da cancellare`);
    
    // Cancella i duplicati
    for (const id of toDelete) {
      await ctx.runMutation(internal.search.deleteBlockEmbedding, { embeddingId: id });
    }
    
    const result = `[Clean Embeddings] ✅ Cancellati ${toDelete.length} duplicati su ${allEmbeddings.length} embeddings totali`;
    console.log(result);
    return result;
  }
});

// 3. Pulisce ENTRAMBE le tabelle in sequenza
export const cleanAllDuplicates = internalAction({
  handler: async (ctx) => {
    console.log("[Clean All] 🧹 Avvio pulizia completa...");
    
    const textResult = await ctx.runAction(internal.search.cleanDuplicateTextBlocks);
    const embResult = await ctx.runAction(internal.search.cleanDuplicateEmbeddings);
    
    const finalResult = {
      textBlocks: textResult,
      embeddings: embResult,
      summary: "✅ Pulizia completata!"
    };
    
    console.log("[Clean All] ✅ Pulizia completata!");
    return finalResult;
  }
});

