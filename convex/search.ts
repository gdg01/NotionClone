import { v } from "convex/values";
import { 
  action, 
  query, 
  internalAction, 
  internalQuery, 
  internalMutation 
} from "./_generated/server";
import { api, internal } from "./_generated/api";

const serperApiKey = process.env.SERPER_API_KEY;
const hfApiKey = process.env.HUGGINGFACE_API_KEY;
const googleApiKey = process.env.GEMINI_API_KEY; 

// --- Funzioni helper (embed, wait, searchWeb) (INVARIATE) ---
// ... (tutta la logica di 'embed', 'wait', 'searchWeb' rimane identica) ...
type EmbedInputType = "query" | "document";
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const embed = async (text: string, inputType: EmbedInputType): Promise<number[]> => {
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
};
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
// --- FINE Funzioni helper ---


// --- Funzione di Parsing (NUOVA) ---
/**
 * Estrae i contenuti dai delimitatori specifici.
 * Es. [TAG]: Contenuto [ALTRO_TAG]: ...
 */
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


// --- 3. AZIONE PRINCIPALE DI RICERCA (MODIFICATA) ---

export const performContextualSearch = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    console.log(`[Search] Ricerca per: "${args.query}"`);

    // 1. & 2. Ricerche (come prima)
    const queryEmbedding = await embed(args.query, "query");
    const [internalResults, externalResults] = await Promise.all([
        ctx.runAction(internal.search.searchInternal, { queryEmbedding: queryEmbedding }),
        searchWeb(args.query)
    ]);
    console.log(`[Search] Ricevuti ${internalResults.length} risultati interni e ${externalResults.length} esterni.`);

    // 3. Preparazione Contesti (come prima)
    const internalContext = internalResults
      .map(res => `Titolo Pagina: ${res.pageTitle}\nContenuto: ${res.textPreview}`)
      .join("\n\n---\n\n");

    const externalContext = externalResults
      .map(res => `Sito: ${res.source_title}\nContenuto: ${res.snippet}`)
      .join("\n\n---\n\n");

    // --- MODIFICA: Creazione del "One-Shot Prompt" ---

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
    
    console.log(`[Search] Invio One-Shot Prompt a Groq...`);

    // --- MODIFICA: Esegui 1 SOLA chiamata AI ---
    const aiResponse = await ctx.runAction(api.ai.askGroq, {
      history: [{ role: "user", content: oneShotPrompt }]
    });

    console.log("[Search] Ricevuta risposta AI, inizio parsing...");

    // --- MODIFICA: Parsa la risposta singola ---
    const internalSummary = extractSection(aiResponse, "INTERNAL SUMMARY", "EXTERNAL SUMMARY");
    const externalSummary = extractSection(aiResponse, "EXTERNAL SUMMARY", "COMBINED SUMMARY");
    const combinedSummary = extractSection(aiResponse, "COMBINED SUMMARY");

    // Fallback nel caso l'AI non segua il formato
    if (!internalSummary && !externalSummary && !combinedSummary && aiResponse.length > 10) {
        console.warn("[Search] L'AI non ha seguito il formato. Uso la risposta grezza come summary combinato.");
        return {
            combinedSummary: aiResponse, // Metti tutto nel combinato
            internalSummary: "",
            externalSummary: "",
            internal: internalResults,
            external: externalResults
        };
    }
    
    console.log(`[Search] Parsing completato.`);

    // --- MODIFICA: Restituisci i 3 riassunti parsati ---
    return {
      combinedSummary,
      internalSummary,
      externalSummary,
      internal: internalResults,
      external: externalResults
    };
  },
});


// --- 4. QUERY DI RICERCA INTERNA (VERSIONE CORRETTA) ---
// ... (tutta la logica di 'searchInternal' rimane identica) ...
export const searchInternal = action({
  args: { queryEmbedding: v.array(v.float64()) },
  handler: async (ctx, args) => {
    if (args.queryEmbedding.length === 0) { console.warn("[Search Internal] Embedding vuoto, skip ricerca"); return []; }
    console.log("[Search Internal] Avviata ricerca vettoriale...");
    const searchResults = await ctx.vectorSearch("textBlocks", "by_embedding", { vector: args.queryEmbedding, limit: 8 });
    console.log(`[Search Internal] Score dei risultati:`, searchResults.map(r => ({id: r._id, score: r._score})));
    console.log(`[Search Internal] vectorSearch ha restituito ${searchResults.length} ID.`);
    if (searchResults.length === 0) return [];
    
    const scoreMap = new Map(searchResults.map(res => [res._id, res._score]));
    const blockIds = searchResults.map(res => res._id);
    const blocks = await ctx.runQuery(internal.search.getBlocksByIds, { ids: blockIds });
    console.log(`[Search Internal] Recuperati ${blocks.length} documenti completi da textBlocks.`);
    const validPageIds = [ ...new Set( blocks.map((res) => res.pageId).filter((id): id is Id<"pages"> => id !== null && id !== undefined) )];
    console.log(`[Search Internal] Page ID validi estratti: ${validPageIds.length}`, validPageIds);
    if (validPageIds.length === 0) { console.log("[Search Internal] Nessun Page ID valido trovato. Uscita."); return []; }
    const pages = await ctx.runQuery(internal.search.getPagesByIds, { ids: validPageIds });
    const pageMap = new Map( pages.map((p) => [p._id, { title: p.title, icon: p.icon }]) );
    console.log(`[Search Internal] Mappa delle pagine creata (${pageMap.size} pagine).`);
    const finalResults = blocks
      .filter((block) => block.pageId && pageMap.has(block.pageId))
      .map((block) => ({
        _id: block.pageId,
        blockId: block.blockId,
        score: scoreMap.get(block._id) || 0,
        textPreview: block.text,
        pageTitle: pageMap.get(block.pageId!)?.title || "Pagina non trovata",
        pageIcon: pageMap.get(block.pageId!)?.icon || "📄",
      }))
      .filter((res) => res.score > 0.6) 
      .sort((a, b) => b.score - a.score);
    console.log(`[Search Internal] Risultati finali elaborati: ${finalResults.length}`);
    if (finalResults.length > 0) { console.log(`[Search Internal] Score range: ${finalResults[0].score.toFixed(3)} - ${finalResults[finalResults.length-1].score.toFixed(3)}`); }
    return finalResults;
  },
});
// --- 5. LOGICA DI INDICIZZAZIONE ---

const extractTextFromNode = (node: any): { id: string; text: string }[] => {
  let blocks: { id: string; text: string }[] = [];
  const nodeId = node.attrs?.id || null;
  const searchableTypes = ["paragraph", "heading", "callout", "blockquote"];
  
  if (searchableTypes.includes(node.type) && nodeId) {
    const text = node.content?.map((n: any) => n.text).join("") || "";
    if (text.trim().length > 10) { 
      blocks.push({ id: nodeId, text: text }); 
    }
  }
  
  if (node.content && node.type !== "codeBlock") {
    node.content.forEach((childNode: any) => {
      blocks = blocks.concat(extractTextFromNode(childNode));
    });
  }
  
  return blocks;
};

export const getBlocksForPage = internalQuery({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => { 
    return await ctx.db
      .query("textBlocks")
      .filter(q => q.eq(q.field("pageId"), args.pageId))
      .collect(); 
  },
});

export const insertBlock = internalMutation({
  args: { 
    pageId: v.id("pages"), 
    blockId: v.string(), 
    text: v.string(), 
    embedding: v.array(v.float64())
  },
  handler: async (ctx, args) => { 
    await ctx.db.insert("textBlocks", args); 
  },
});

export const deleteBlock = internalMutation({
  args: { blockId: v.id("textBlocks") },
  handler: async (ctx, args) => { 
    await ctx.db.delete(args.blockId); 
  },
});


// --- 6. WORKER DELLA CODA (OTTIMIZZATO) ---

// Tipo helper per il blocco estratto
type TextBlock = { id: string; text: string };

// Helper function per trovare un doc (dal DB) in una lista
const findDoc = (list: Doc<"textBlocks">[], id: string) => list.find(b => b.blockId === id);
// Helper function per trovare un blocco (dal JSON) in una lista
const findBlock = (list: TextBlock[], id: string) => list.find(b => b.id === id);


export const processEmbeddingQueue = internalAction({
  handler: async (ctx) => {
    // 1. Prendi il prossimo lavoro (invariato)
    const job = await ctx.runQuery(internal.search.getNextQueueJob);
    if (!job) {
      console.log("[Queue] Coda vuota, nessun lavoro da processare");
      return;
    }

    const { pageId, contentJson } = job;
    console.log(`[Queue] Processando (Sostenibile) pagina: ${pageId}`);
    
    // 2. ESEGUI IL LAVORO (Indicizzazione Ottimizzata)
    try {
      // 2a. Calcola stato VECCHIO (dal DB) e NUOVO (dal JSON)
      const oldBlocks = await ctx.runQuery(internal.search.getBlocksForPage, { pageId });
      const content = JSON.parse(contentJson);
      const newBlocks = extractTextFromNode(content);
      
      console.log(`[Queue] Confronto: ${oldBlocks.length} blocchi vecchi vs ${newBlocks.length} blocchi nuovi`);

      // 2b. Calcola il DELTA

      // Blocchi DA RIMUOVERE: (Sono nel DB ma non più nel JSON)
      const blocksToRemove = oldBlocks.filter(oldBlock => 
        !findBlock(newBlocks, oldBlock.blockId)
      );

      // Blocchi DA AGGIUNGERE: (Sono nel JSON ma non nel DB)
      const blocksToAdd = newBlocks.filter(newBlock =>
        !findDoc(oldBlocks, newBlock.id)
      );

      // Blocchi DA AGGIORNARE: (Sono in entrambi, ma il testo è cambiato)
      const blocksToUpdate = newBlocks.filter(newBlock => {
        const oldMatch = findDoc(oldBlocks, newBlock.id);
        // Esiste E il testo è diverso?
        return oldMatch && oldMatch.text !== newBlock.text;
      });

      // 2c. ESEGUI SOLO LE OPERAZIONI NECESSARIE

      // Rimuovi i blocchi eliminati
      for (const block of blocksToRemove) {
        await ctx.runMutation(internal.search.deleteBlock, { blockId: block._id });
      }

      // Aggiungi i blocchi nuovi (chiamata API costosa)
      for (const block of blocksToAdd) {
        const embedding = await embed(block.text, "document");
        if (embedding.length > 0) {
          await ctx.runMutation(internal.search.insertBlock, {
            pageId: pageId, 
            blockId: block.id, 
            text: block.text, 
            embedding: embedding,
          });
        }
      }

      // Aggiorna i blocchi modificati (chiamata API costosa)
      for (const block of blocksToUpdate) {
        // Trova il vecchio documento da cancellare
        const oldDoc = oldBlocks.find(b => b.blockId === block.id);
        if (oldDoc) {
          await ctx.runMutation(internal.search.deleteBlock, { blockId: oldDoc._id });
        }
        
        // Inserisci il nuovo
        const embedding = await embed(block.text, "document");
        if (embedding.length > 0) {
          await ctx.runMutation(internal.search.insertBlock, {
            pageId: pageId, 
            blockId: block.id, 
            text: block.text, 
            embedding: embedding,
          });
        }
      }

      const unchangedCount = oldBlocks.length - blocksToRemove.length - blocksToUpdate.length;
      console.log(`[Queue] ✅ Indicizzata pagina ${pageId} (Aggiunti: ${blocksToAdd.length}, Rimossi: ${blocksToRemove.length}, Aggiornati: ${blocksToUpdate.length}, Invariati: ${unchangedCount})`);

    } catch (e: any) {
      console.error(`[Queue] ❌ Fallita indicizzazione pagina ${pageId}:`, e?.message || e);
      // Non rilanciamo l'errore, così la coda può continuare
    }
    
    // 3. Rimuovi il lavoro completato dalla coda (invariato)
    await ctx.runMutation(internal.search.deleteQueueJob, { jobId: job._id });

    // 4. Controlla se ci sono altri lavori (invariato)
    const nextJob = await ctx.runQuery(internal.search.getNextQueueJob);
    if (nextJob) {
      console.log("[Queue] Altri lavori in coda, scheduling prossimo...");
      await ctx.scheduler.runAfter(5000, internal.search.processEmbeddingQueue, {});
    } else {
      console.log("[Queue] ✅ Coda completata!");
    }
  }
});

// --- 7. GESTIONE CODA ---

export const enqueueEmbeddingJob = internalMutation({
  args: {
    pageId: v.id("pages"),
    contentJson: v.string(),
  },
  handler: async (ctx, args) => {
    // Evita duplicati: rimuovi vecchi lavori per questa pagina
    const existing = await ctx.db
      .query("embeddingQueue")
      .filter(q => q.eq(q.field("pageId"), args.pageId))
      .collect();
      
    for (const job of existing) {
      await ctx.db.delete(job._id);
    }
    
    // Aggiungi il nuovo lavoro
    await ctx.db.insert("embeddingQueue", {
      pageId: args.pageId,
      contentJson: args.contentJson,
    });

    console.log(`[Queue] Aggiunto lavoro per pagina: ${args.pageId}`);

    // Avvia il processore
    await ctx.scheduler.runAfter(0, internal.search.processEmbeddingQueue, {});
  }
});

export const getNextQueueJob = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("embeddingQueue")
      .order("asc") // FIFO: processa nell'ordine di arrivo
      .first();
  }
});

export const deleteQueueJob = internalMutation({
  args: { jobId: v.id("embeddingQueue") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.jobId);
  }
});


// --- 8. BACKFILL ---

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

// Aggiungi temporaneamente questo al tuo search.ts

export const clearAndRebuild = internalAction({
  handler: async (ctx) => {
    console.log("[Clear] Cancellazione di tutti i textBlocks...");
    
    // 1. Prendi tutti i blocchi
    const allBlocks = await ctx.runQuery(internal.search.getAllBlocks);
    
    // 2. Cancellali uno per uno
    for (const block of allBlocks) {
      await ctx.runMutation(internal.search.deleteBlock, { blockId: block._id });
    }
    
    console.log(`[Clear] ✅ Cancellati ${allBlocks.length} blocchi`);
    
    // 3. Ora ri-indicizza tutto
    console.log("[Rebuild] Avvio re-indicizzazione...");
    const result = await ctx.runAction(internal.search.backfillAllPages, {});
    
    return {
      deleted: allBlocks.length,
      result: result
    };
  }
});

// Aggiungi anche questa query helper
export const getAllBlocks = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("textBlocks").collect();
  }
});


export const getPagesByIds = internalQuery({
  args: { ids: v.array(v.id("pages")) },
  handler: async (ctx, args) => {
    if (args.ids.length === 0) return [];
    return await ctx.db
      .query("pages")
      .filter(q => q.or(...args.ids.map(id => q.eq(q.field("_id"), id))))
      .collect();
  },
});

// Helper per recuperare i documenti completi dei blocchi di testo
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