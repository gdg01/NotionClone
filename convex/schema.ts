// File: convex/schema.ts 
// (SOSTITUZIONE COMPLETA - Schema Corretto a 2 Tabelle)

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // --- Tabella Pagine (Metadati) ---
  pages: defineTable({
    title: v.string(),
    userId: v.string(),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("pages")),
    isArchived: v.boolean(),
    coverImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isPinned: v.optional(v.boolean()),
    properties: v.optional(v.any()),
    isPublic: v.optional(v.boolean()),
    shareId: v.optional(v.string()),
  })
    .index("byUser", ["userId"])
    .index("byUserAndParent", ["userId", "parentId"])
    .index("by_shareId", ["shareId"]),

  // --- Tabella Contenuto Principale ---
  pageContent: defineTable({
    pageId: v.id("pages"),
    content: v.optional(v.string()),
  }).index("byPageId", ["pageId"]),

  // --- Tabella Tag ---
  tags: defineTable({
    name: v.string(),
    userId: v.string(),
    color: v.string(),
  }).index("byUserAndName", ["userId", "name"]),

  // --- INIZIO OTTIMIZZAZIONE BANDA ---

  // 1. Tabella "textBlocks" (LEGGERA)
  // Contiene solo il testo per i confronti hash.
  textBlocks: defineTable({
    pageId: v.id("pages"),
    blockId: v.string(),
    text: v.string(),
    contentHash: v.optional(v.string()),
    // --- 'embedding' RIMOSSO DA QUI ---
  })
    .index("by_pageId", ["pageId"])
    .index("by_blockId", ["blockId"]), // Indice per join veloci

  // 2. Tabella "blockEmbeddings" (PESANTE)
  // Contiene solo i vettori per la ricerca AI.
blockEmbeddings: defineTable({
    pageId: v.id("pages"), 
    blockId: v.string(), 
    embedding: v.array(v.float64()),
  })
    .index("by_pageId_blockId", ["pageId", "blockId"]) 
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      // --- INIZIO CORREZIONE ---
      filterFields: ["pageId", "blockId"], // <-- AGGIUNGI "blockId" QUI
      // --- FINE CORREZIONE ---
    }),

  // --- FINE OTTIMIZZAZIONE BANDA ---

  // --- Tabella Coda di Indicizzazione ---
embeddingQueue: defineTable({
  pageId: v.id("pages"),
  contentJson: v.string(),
  processing: v.optional(v.boolean()),  // <-- AGGIUNGI QUESTA RIGA
  processingStartedAt: v.optional(v.number()), // <-- OPZIONALE: per timeout
}).index("by_pageId", ["pageId"]),


  // --- Tabella Backlinks ---
  backlinks: defineTable({
    sourcePageId: v.id("pages"),
    userId: v.string(),
    targetPageId: v.id("pages"),
    targetBlockId: v.optional(v.string()),
    snippet: v.string(),
  })
    .index("by_target", ["userId", "targetPageId"])
    .index("by_source", ["userId", "sourcePageId"]),

  // --- Tabella Tasks ---
  tasks: defineTable({
    title: v.string(),
    userId: v.string(),
    pageId: v.id("pages"),
    status: v.string(),
    description: v.optional(v.string()),
  })
    .index("byUser", ["userId"])
    .index("byUserAndPage", ["userId", "pageId"]),
});