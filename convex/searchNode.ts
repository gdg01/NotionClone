// File: convex/searchNode.ts
// (SOSTITUZIONE COMPLETA - Con gestione errori e lock corretta)

"use node"; // <-- DEVE ESSERE LA PRIMA RIGA

import { v } from "convex/values";
import { 
  internalAction, 
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Importa il modulo crypto nativo di Node.js
import crypto from 'crypto';

// --- Funzione di estrazione testo (spostata qui) ---
const extractTextFromNode = (node: any): { id: string; text: string }[] => {
  let blocks: { id: string; text: string }[] = [];
  const nodeId = node.attrs?.id || null;
  const searchableTypes = ["paragraph", "heading", "callout", "blockquote"];
  
  if (searchableTypes.includes(node.type) && nodeId) {
    const text = node.content?.map((n: any) => n.text).join("") || "";
    // Ottimizzazione Granularità: soglia 50 caratteri
    if (text.trim().length > 50) { 
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

// --- Tipi Helper per il confronto (spostati qui) ---
type OldBlock = Awaited<ReturnType<typeof internal.search.getBlocksForPage>>[number];
const findDoc = (list: OldBlock[], id: string) => list.find(b => b.blockId === id);
type NewBlock = { id: string; text: string; hash: string }; // Ora include l'hash
const findBlock = (list: NewBlock[], id: string) => list.find(b => b.id === id);


// --- WORKER DELLA CODA (CORRETTO) ---
export const processEmbeddingQueue = internalAction({
  handler: async (ctx) => {
    // 1. Prendi il prossimo lavoro DISPONIBILE (non in processing)
    const job = await ctx.runQuery(internal.search.getNextQueueJob);
    if (!job) {
      return; // Corretto: la catena si ferma qui
    }

    // 2. IMPORTANTE: Marca subito come "in lavorazione" (LOCK)
    await ctx.runMutation(internal.search.markJobAsProcessing, { jobId: job._id });

    const { pageId, contentJson } = job;
    
    try {
      // --- INIZIO LOGICA DI ELABORAZIONE ---
      const oldTextBlocks = await ctx.runQuery(internal.search.getBlocksForPage, { pageId });
      const oldEmbeddings = await ctx.runQuery(internal.search.getEmbeddingsForPage, { pageId });
      
      const content = JSON.parse(contentJson);
      const newBlocksRaw = extractTextFromNode(content);

      const newBlocks = newBlocksRaw.map(block => {
        const hash = crypto.createHash('sha256').update(block.text).digest('hex');
        return { ...block, hash: hash };
      });
      
      console.log(`[Queue] Confronto: ${oldTextBlocks.length} vecchi vs ${newBlocks.length} nuovi`);

      const blocksToRemove = oldTextBlocks.filter(oldBlock => 
        !findBlock(newBlocks, oldBlock.blockId)
      );
      const blocksToAdd = newBlocks.filter(newBlock =>
        !findDoc(oldTextBlocks, newBlock.id)
      );
      const blocksToUpdate = newBlocks.filter(newBlock => {
        const oldMatch = findDoc(oldTextBlocks, newBlock.id);
        return oldMatch && oldMatch.contentHash !== newBlock.hash;
      });

      // Rimozione
      for (const block of blocksToRemove) {
        await ctx.runMutation(internal.search.deleteTextBlock, { textBlockId: block._id });
        const embeddingDoc = oldEmbeddings.find(e => e.blockId === block.blockId);
        if (embeddingDoc) {
          await ctx.runMutation(internal.search.deleteBlockEmbedding, { embeddingId: embeddingDoc._id });
        }
      }

      // Aggiunta (con UPSERT)
      for (const block of blocksToAdd) {
        const embedding = await ctx.runAction(internal.search.embed, {
          text: block.text,
          inputType: "document"
        });
        
        if (embedding.length > 0) {
          await ctx.runMutation(internal.search.upsertTextBlock, {
            pageId: pageId, 
            blockId: block.id, 
            text: block.text, 
            contentHash: block.hash,
          });
          await ctx.runMutation(internal.search.upsertBlockEmbedding, {
            pageId: pageId,
            blockId: block.id,
            embedding: embedding,
          });
        }
      }

      // Aggiornamento (con UPSERT)
      for (const block of blocksToUpdate) {
        // Aggiorna textBlock (se esiste)
        const oldDoc = oldTextBlocks.find(b => b.blockId === block.id);
        if (oldDoc) {
          await ctx.runMutation(internal.search.updateTextBlock, { 
            textBlockId: oldDoc._id, 
            text: block.text, 
            contentHash: block.hash 
          });
        }
        
        // Cancella vecchio embedding (se esiste)
        const embeddingDoc = oldEmbeddings.find(e => e.blockId === block.id);
        if (embeddingDoc) {
          await ctx.runMutation(internal.search.deleteBlockEmbedding, { embeddingId: embeddingDoc._id });
        }

        // Crea nuovo embedding
        const embedding = await ctx.runAction(internal.search.embed, {
          text: block.text,
          inputType: "document"
        });
        
        // Inserisci nuovo embedding (usando upsert per sicurezza)
        if (embedding.length > 0) {
          await ctx.runMutation(internal.search.upsertBlockEmbedding, {
            pageId: pageId,
            blockId: block.id,
            embedding: embedding,
          });
        }
      }

      const unchangedCount = oldTextBlocks.length - blocksToRemove.length - blocksToUpdate.length;
      // --- FINE LOGICA DI ELABORAZIONE ---

      // 3. Rimuovi il lavoro COMPLETATO (SPOSTATO DENTRO IL TRY)
      await ctx.runMutation(internal.search.deleteQueueJob, { jobId: job._id });

    } catch (e: any) {
      console.error(`[Queue] ❌ Errore pagina ${pageId}:`, e?.message || e);
      
      // --- CORREZIONE GESTIONE ERRORE ---
      // In caso di errore, SBLOCCA il job per ritentare
      await ctx.runMutation(internal.search.unmarkJobAsProcessing, { 
        jobId: job._id 
      });
      // NON cancellare il job. La catena si fermerà qui
      // per evitare loop infiniti di errori.
      return; // Interrompi l'esecuzione
    }
    
    // 4. Schedula il prossimo (ora si trova fuori dal try/catch)
    const nextJob = await ctx.runQuery(internal.search.getNextQueueJob);
    if (nextJob) {
      // Schedula a 0ms per massima velocità
      await ctx.scheduler.runAfter(0, internal.searchNode.processEmbeddingQueue, {});
    } else {
      console.log("[Queue] ✅ Coda completata!");
    }
  }
});

// --- FUNZIONE BACKFILL HASH (SPOSTATA QUI) ---
export const hashBlocks = internalAction({
  handler: async (ctx) => {
    
    // 1. Ottieni TUTTI i blocchi (dalla tabella 'textBlocks')
    const allBlocks = await ctx.runQuery(internal.search.getAllBlocksWithText);
    
    let updatedCount = 0;
    
    // 2. Itera e aggiorna
    for (const block of allBlocks) {
      const newHash = crypto.createHash('sha256').update(block.text).digest('hex');
      
      if (block.contentHash !== newHash) {
        await ctx.runMutation(internal.search.updateContentHash, {
          blockId: block._id,
          contentHash: newHash,
        });
        updatedCount++;
      }
    }
    
    const result = `[Backfill Hash] ✅ Completato. ${updatedCount} blocchi aggiornati.`;
    return result;
  }
});