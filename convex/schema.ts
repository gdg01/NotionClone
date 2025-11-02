// File: convex/schema.ts (SOSTITUZIONE COMPLETA)
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Le tue tabelle esistenti
  pages: defineTable({
    title: v.string(),
    userId: v.string(),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("pages")),
    isArchived: v.boolean(),
    coverImage: v.optional(v.string()), // URL dell'immagine di copertina
    tags: v.optional(v.array(v.string())), // Array di tag
    isPinned: v.optional(v.boolean()), // Per "fissare" le note

    // Per proprietà personalizzate (es. Stato: "In corso", Priorità: "Alta")
    // v.any() permette di salvare qualsiasi oggetto JSON valido.
    properties: v.optional(v.any()),
  })
    .index("byUser", ["userId"])
    .index("byUserAndParent", ["userId", "parentId"]),

  pageContent: defineTable({
    pageId: v.id("pages"),
    content: v.optional(v.string()),
  }).index("byPageId", ["pageId"]),

  tags: defineTable({
    name: v.string(), // Il nome del tag (es. "lavoro")
    userId: v.string(), // Per chi è questo tag
    color: v.string(), // Il NOME del colore (es. "red", "blue")
  })
    // Indice per trovare/creare tag e garantirne l'unicità per utente
    .index("byUserAndName", ["userId", "name"]),

  textBlocks: defineTable({
    pageId: v.id("pages"),
    blockId: v.string(),
    text: v.string(),
    embedding: v.array(v.float64()),
  })
    .index("by_pageId", ["pageId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["pageId"],
    }),

  // --- NUOVA TABELLA PER LA CODA ---
  embeddingQueue: defineTable({
    pageId: v.id("pages"),
    contentJson: v.string(),
  }).index("by_pageId", ["pageId"]), // Indice per cercare per pageId

  backlinks: defineTable({
    // La pagina che CONTIENE il link (Pagina A)
    sourcePageId: v.id("pages"),
    // L'utente a cui appartiene questo link (per sicurezza)
    userId: v.string(),

    // La pagina a CUI PUNTA il link (Pagina B)
    targetPageId: v.id("pages"),
    // Opzionale: l'ID del blocco a cui punta (per i BlockLink)
    targetBlockId: v.optional(v.string()),

    // Un piccolo frammento di testo per dare contesto
    snippet: v.string(),
  })
    // L'INDICE CHIAVE: Permette di trovare velocemente tutti i link
    // che puntano a una specifica 'targetPageId'.
    .index("by_target", ["userId", "targetPageId"])
    // Un altro indice utile per pulire i vecchi link
    .index("by_source", ["userId", "sourcePageId"]),
});
