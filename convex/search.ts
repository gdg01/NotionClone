// File: convex/search.ts
// (SOSTITUZIONE COMPLETA - Con Workaround per vecchia versione di Convex)

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
    
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.warn("[Search] Utente non autenticato.");
      return {
        combinedSummary: "Devi essere autenticato per usare la ricerca interna.",
        internalSummary: "Devi essere autenticato per usare la ricerca interna.",
        externalSummary: "", 
        internal: [],
        external: [] 
      };
    }
    const userId = identity.subject;

    const queryEmbedding = await ctx.runAction(internal.search.embed, { 
      text: args.query, 
      inputType: "query"
    });
    
    const [internalResults, externalResults] = await Promise.all([
        ctx.runAction(internal.search.searchInternal, { 
          queryEmbedding: queryEmbedding,
          userId: userId 
        }),
        searchWeb(args.query)
    ]);

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
// FUNZIONE searchInternal - VERSIONE CON BATCHING FIX
// ============================================
export const searchInternal = action({
  args: { queryEmbedding: v.array(v.float64()), userId: v.string() },
  handler: async (ctx, args) => {
    
    if (args.queryEmbedding.length === 0) { 
      console.warn("[Search Internal] Embedding vuoto, skip ricerca"); 
      return []; 
    }

    // 1. Ottieni i pageId dell'utente PRIMA della ricerca
    const userPageIds = await ctx.runQuery(internal.search.getAllPageIdsForUser, { 
      userId: args.userId 
    });

    if (userPageIds.length === 0) {
      console.warn(`[Search Internal] Nessuna pagina per l'utente ${args.userId}, skip.`);
      return [];
    }
    
    // --- INIZIO MODIFICA PER ERRORE "Too many conditions" ---
    
    const MAX_FILTER_CONDITIONS = 64; // Limite del database
    const allVectorResults: { _id: Id<"blockEmbeddings">, _score: number }[] = [];
    const queryLimit = 10; // Il limite di risultati che vogliamo alla fine
    
    // 2. Esegui la vector search in blocchi (batch) se l'utente ha più di 64 pagine
    for (let i = 0; i < userPageIds.length; i += MAX_FILTER_CONDITIONS) {
      const pageIdChunk = userPageIds.slice(i, i + MAX_FILTER_CONDITIONS);
      
      console.log(`[Search Internal] Eseguo chunk ${Math.floor(i / MAX_FILTER_CONDITIONS) + 1}/${Math.ceil(userPageIds.length / MAX_FILTER_CONDITIONS)} con ${pageIdChunk.length} pageId`);
      
      const chunkResults = await ctx.vectorSearch("blockEmbeddings", "by_embedding", { 
          vector: args.queryEmbedding, 
          limit: queryLimit, // Chiediamo i top 10 per ogni chunk
          filter: (q) => q.or(...pageIdChunk.map(id => q.eq("pageId", id))),
          // 'resultFields' rimosso (come già fatto da te per la compatibilità)
      });
      
      allVectorResults.push(...chunkResults);
    }
    
    // Ora abbiamo i risultati da tutti i chunk.
    // Dobbiamo ri-ordinarli e prendere i 10 migliori in assoluto.
    const vectorResults = allVectorResults
      .sort((a, b) => b._score - a._score) // Ordina per score (decrescente)
      .slice(0, queryLimit); // Prendi i 10 migliori totali

    // --- FINE MODIFICA ---
    
    
    if (vectorResults.length === 0) {
      return [];
    }
    
    // 3. RECUPERA I DATI COMPLETI DAGLI EMBEDDING
    // (Il resto del tuo codice da qui in poi è corretto)
    const embeddingIds = vectorResults.map(r => r._id);
    const searchResults = await ctx.runQuery(internal.search.getEmbeddingsByIds, { ids: embeddingIds });

    // Crea una mappa degli score per reinserirli
    const scoreMap = new Map(vectorResults.map(res => [res._id, res._score]));

    // 4. Estrai pageIds e blockIds dai risultati completi ('searchResults')
    const pageIds = [...new Set(
      searchResults
        .map(emb => emb.pageId)
        .filter((id): id is Id<"pages"> => id !== undefined && id !== null)
    )];

    const blockIds = searchResults
      .map(emb => emb.blockId)
      .filter((id): id is string => id !== undefined && id !== null && id !== "");
      
    // --- FINE CORREZIONE (tua) ---


    // 5. Recupera i metadati (Pagine e Testo) in parallelo
    const [pages, textBlocks] = await Promise.all([
      // Ho corretto anche un piccolo refuso qui: era { ids: pageId: pageIds }
      ctx.runQuery(internal.search.getPagesByIds, { ids: pageIds }), 
      ctx.runQuery(internal.search.getTextBlocksByBlockIds, { blockIds: blockIds })
    ]);
    
    
    // 6. Crea mappe per lookup veloce
    const pageMap = new Map(pages.map((p) => [p._id, { title: p.title, icon: p.icon, userId: p.userId }]));
    const textMap = new Map(textBlocks.map((b) => [b.blockId, b.text]));

    // 7. Unisci i risultati
    const finalResults = searchResults // <-- Usa 'searchResults' (i doc completi)
      .map((result) => {
        const pageInfo = pageMap.get(result.pageId);
        const textPreview = textMap.get(result.blockId);
        // Prendi lo score dalla mappa usando l'_id del documento embedding
        const score = scoreMap.get(result._id) || 0; 
        
        if (!pageInfo || !textPreview) {
          console.warn(`[Search Internal] Dati mancanti per blockId: ${result.blockId}`);
          return null;
        }

        return {
          _id: result.pageId,
          blockId: result.blockId,
          score: score, // Inserisci lo score corretto
          textPreview: textPreview,
          pageTitle: pageInfo.title || "Pagina non trovata",
          pageIcon: pageInfo.icon || "📄",
        };
      })
      .filter((res): res is NonNullable<typeof res> => res !== null)
      .filter((res) => {
        const passThreshold = res.score > 0.4; // Soglia 0.4
        if (!passThreshold) {
          console.log(`[Search Internal] Scartato risultato con score ${res.score} (soglia: 0.4)`);
        }
        return passThreshold;
      })
      .sort((a, b) => b.score - a._score);

    
    if (finalResults.length > 0) {
      console.log(`[Search Internal] Top risultato: score=${finalResults[0].score}, title="${finalResults[0].pageTitle}"`);
    }
    
    return finalResults;
  },
});

// ============================================
// HELPER FUNCTIONS NECESSARIE
// ============================================

// Recupera embeddings completi per ID
// QUESTA FUNZIONE È ORA CRUCIALE
export const getEmbeddingsByIds = internalQuery({
  args: { ids: v.array(v.id("blockEmbeddings")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) return [];
    
    const embeddings = await Promise.all(
      args.ids.map(id => ctx.db.get(id))
    );
    
    // Filtra i null e restituisce i documenti completi
    return embeddings.filter((e): e is Doc<"blockEmbeddings"> => e !== null);
  },
});

// Recupera textBlocks per blockIds (usa .first() per sicurezza)
export const getTextBlocksByBlockIds = internalQuery({
  args: { blockIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (args.blockIds.length === 0) {
      return [];
    }

    const blocks = await Promise.all(
      args.blockIds.map(blockId => 
        ctx.db.query("textBlocks")
          .withIndex("by_blockId", q => q.eq("blockId", blockId))
          .first()
      )
    );
    
    const foundBlocks = blocks.filter((b): b is Doc<"textBlocks"> => b !== null);
    
    
    return foundBlocks;
  },
});

// Recupera pagine per IDs
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

// Ottieni tutti i pageId per un utente (per filtro sicurezza)
export const getAllPageIdsForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("pages")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
      .collect();
    return pages.map(p => p._id);
  },
});

// --- LOGICA DI INDICIZZAZIONE (Query e Mutazioni per lo schema a 2 tabelle) ---

export const getBlocksForPage = internalQuery({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => { 
    const blocks = await ctx.db
      .query("textBlocks")
      .withIndex("by_pageId", q => q.eq("pageId", args.pageId))
      .collect();
      
    return blocks.map(block => ({
      _id: block._id,
      blockId: block.blockId,
      contentHash: block.contentHash,
    }));
  },
});

export const getEmbeddingsForPage = internalQuery({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const embeddings = await ctx.db
      .query("blockEmbeddings")
      .withIndex("by_pageId_blockId", q => q.eq("pageId", args.pageId))
      .collect();
    
    return embeddings.map(emb => ({
      _id: emb._id,
      blockId: emb.blockId,
    }));
  }
});

export const upsertTextBlock = internalMutation({
  args: { 
    pageId: v.id("pages"), 
    blockId: v.string(), 
    text: v.string(), 
    contentHash: v.string(), 
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("textBlocks")
      .withIndex("by_blockId", q => q.eq("blockId", args.blockId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        text: args.text,
        contentHash: args.contentHash,
        pageId: args.pageId,
      });
    } else {
      await ctx.db.insert("textBlocks", {
        pageId: args.pageId,
        blockId: args.blockId,
        text: args.text,
        contentHash: args.contentHash,
      });
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
    const existing = await ctx.db
      .query("blockEmbeddings")
      .withIndex("by_pageId_blockId", q => 
        q.eq("pageId", args.pageId).eq("blockId", args.blockId)
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        embedding: args.embedding,
      });
    } else {
      await ctx.db.insert("blockEmbeddings", {
        pageId: args.pageId,
        blockId: args.blockId,
        embedding: args.embedding,
      });
    }
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

// --- GESTIONE CODA (CORRETTA) ---
export const enqueueEmbeddingJob = internalMutation({
  args: {
    pageId: v.id("pages"),
    contentJson: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("embeddingQueue")
      .filter(q => q.eq(q.field("pageId"), args.pageId))
      .collect();
      
    for (const job of existing) {
      await ctx.db.delete(job._id);
    }
    
    await ctx.db.insert("embeddingQueue", {
      pageId: args.pageId,
      contentJson: args.contentJson,
    });

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

export const markJobAsProcessing = internalMutation({
  args: { jobId: v.id("embeddingQueue") },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.jobId, { 
      processing: true,
      processingStartedAt: now
    });
  }
});

export const unmarkJobAsProcessing = internalMutation({
  args: { jobId: v.id("embeddingQueue") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      processing: false,
      processingStartedAt: undefined
    });
  }
});

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

// --- FUNZIONI DI BACKFILL (CORRETTE) ---
export const getAllPageContents = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("pageContent").fullTableScan().collect();
  },
});

export const backfillAllPages = internalAction({
  args: {},
  handler: async (ctx, args) => {
    
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

    if (count > 0) {
      await ctx.scheduler.runAfter(0, internal.searchNode.processEmbeddingQueue, {});
    }
    
    return result;
  }
});

export const getAllBlocksWithText = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("textBlocks").collect();
  }
});

export const updateContentHash = internalMutation({
  args: {
    blockId: v.id("textBlocks"),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.blockId, { contentHash: args.contentHash });
  }
});

export const clearAndRebuild = internalAction({
  handler: async (ctx) => {
    
    const allBlocks = await ctx.runQuery(internal.search.getAllBlocks);
    const allEmbeddings = await ctx.runQuery(internal.search.getAllEmbeddings);
    
    for (const block of allBlocks) {
      await ctx.runMutation(internal.search.deleteTextBlock, { textBlockId: block._id });
    }
    for (const embedding of allEmbeddings) {
      await ctx.runMutation(internal.search.deleteBlockEmbedding, { embeddingId: embedding._id });
    }
    

    
    const result = await ctx.runAction(internal.search.backfillAllPages, {});
    
    return {
      deletedBlocks: allBlocks.length,
      deletedEmbeddings: allEmbeddings.length,
      result: result
    };
  }
});

export const getAllBlocks = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("textBlocks").collect();
  }
});

export const getAllEmbeddings = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("blockEmbeddings").collect();
  }
});


// --- SCRIPT DI PULIZIA DUPLICATI (Opzionali) ---
export const cleanDuplicateTextBlocks = internalAction({
  handler: async (ctx) => {
    const allBlocks = await ctx.runQuery(internal.search.getAllBlocks);
    const seen = new Map<string, Id<"textBlocks">>();
    const toDelete: Id<"textBlocks">[] = [];
    
    for (const block of allBlocks) {
      const key = `${block.pageId}-${block.blockId}`;
      if (seen.has(key)) {
        toDelete.push(block._id);
      } else {
        seen.set(key, block._id);
      }
    }
    for (const id of toDelete) {
      await ctx.runMutation(internal.search.deleteTextBlock, { textBlockId: id });
    }
    const result = `[Clean TextBlocks] ✅ Cancellati ${toDelete.length} duplicati`;
    return result;
  }
});

export const cleanDuplicateEmbeddings = internalAction({
  handler: async (ctx) => {
    const allEmbeddings = await ctx.runQuery(internal.search.getAllEmbeddings);
    const seen = new Map<string, Id<"blockEmbeddings">>();
    const toDelete: Id<"blockEmbeddings">[] = [];
    
    for (const embedding of allEmbeddings) {
      const key = `${embedding.pageId}-${embedding.blockId}`;
      if (seen.has(key)) {
        toDelete.push(embedding._id);
      } else {
        seen.set(key, embedding._id);
      }
    }
    for (const id of toDelete) {
      await ctx.runMutation(internal.search.deleteBlockEmbedding, { embeddingId: id });
    }
    const result = `[Clean Embeddings] ✅ Cancellati ${toDelete.length} duplicati`;
    return result;
  }
});

export const cleanAllDuplicates = internalAction({
  handler: async (ctx) => {
    const textResult = await ctx.runAction(internal.search.cleanDuplicateTextBlocks);
    const embResult = await ctx.runAction(internal.search.cleanDuplicateEmbeddings);
    const finalResult = { textBlocks: textResult, embeddings: embResult, summary: "✅ Pulizia completata!" };
    return finalResult;
  }
});