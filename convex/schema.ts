// File: convex/schema.ts (SOSTITUZIONE COMPLETA)
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    
    // --- NUOVI CAMPI PER LA CONDIVISIONE ---
    isPublic: v.optional(v.boolean()),
    shareId: v.optional(v.string()), // ID unico per il link pubblico
    // --- FINE NUOVI CAMPI ---
  })
    .index("byUser", ["userId"])
    .index("byUserAndParent", ["userId", "parentId"])
    // --- NUOVO INDICE PER LA CONDIVISIONE ---
    .index("by_shareId", ["shareId"]),

  pageContent: defineTable({
    pageId: v.id("pages"),
    content: v.optional(v.string()),
  }).index("byPageId", ["pageId"]),

  tags: defineTable({
    name: v.string(), 
    userId: v.string(), 
    color: v.string(), 
  })
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

  embeddingQueue: defineTable({
    pageId: v.id("pages"),
    contentJson: v.string(),
  }).index("by_pageId", ["pageId"]), 

  backlinks: defineTable({
    sourcePageId: v.id("pages"),
    userId: v.string(),
    targetPageId: v.id("pages"),
    targetBlockId: v.optional(v.string()),
    snippet: v.string(),
  })
    .index("by_target", ["userId", "targetPageId"])
    .index("by_source", ["userId", "sourcePageId"]),

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
