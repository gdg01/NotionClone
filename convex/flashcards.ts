// File: convex/flashcards.ts (COMPLETAMENTE MODIFICATO)

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// --- COSTANTI SRS (MODIFICATE) ---
const NEW_CARD_DIFFICULTY = 3; // Difficoltà di default
const NEW_CARD_INTERVAL_MINUTES = 1; // 1 minuto per "Sbagliato" (difficulty >= 3)
const LEARNING_INTERVAL_MINUTES = 10; // 10 minuti per "Difficile" (difficulty = 2)
const OK_INTERVAL_DAYS = 1; // 1 giorno per "OK" (difficulty = 1)
const EASY_INTERVAL_DAYS = 4; // 4 giorni per "Facile" (difficulty = 0)

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

// --- Tipi (invariato) ---
export type DeckSummary = {
  deckId: string; // Può essere un pageId o un nome di Tag
  deckName: string;
  deckIcon: string;
  type: 'page' | 'tag';
  counts: {
    new: number;
    learning: number;
    review: number;
    due: number; // Totale di (new + learning + review) che sono dueAt <= now
  };
};

/**
 * Crea una nuova flashcard. (MODIFICATO)
 */
export const create = mutation({
  args: {
    front: v.string(),
    back: v.string(),
    sourcePageId: v.id("pages"),
    sourceBlockId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const cardId = await ctx.db.insert("flashcards", {
      userId: identity.subject,
      sourcePageId: args.sourcePageId,
      sourceBlockId: args.sourceBlockId,
      front: args.front,
      back: args.back,
      tags: args.tags,
      
      // Valori SRS di default (MODIFICATO)
      difficulty: NEW_CARD_DIFFICULTY,
      dueAt: Date.now(), // Scaduta subito
    });

    return cardId;
  },
});

/**
 * Aggiorna il testo di una flashcard (invariato).
 */
export const update = mutation({
  args: {
    cardId: v.id("flashcards"),
    front: v.string(),
    back: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const card = await ctx.db.get(args.cardId);
    if (!card || card.userId !== identity.subject) {
      throw new Error("Card not found or unauthorized");
    }

    await ctx.db.patch(args.cardId, {
      front: args.front,
      back: args.back,
    });
  },
});

/**
 * Crea o aggiorna una flashcard basata sulla sintassi (::) (MODIFICATO)
 */
export const upsertFromSyntax = mutation({
  args: {
    front: v.string(),
    back: v.string(),
    sourcePageId: v.id("pages"),
    sourceBlockId: v.string(), // Obbligatorio per questo
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    // Cerca se esiste già una card per questo blocco
    const existingCard = await ctx.db
      .query("flashcards")
      .withIndex("byBlock", q => q.eq("userId", userId).eq("sourceBlockId", args.sourceBlockId))
      .first();
      
    if (existingCard) {
      // Aggiorna se il testo è cambiato
      if (existingCard.front !== args.front || existingCard.back !== args.back) {
        await ctx.db.patch(existingCard._id, {
          front: args.front,
          back: args.back,
        });
      }
      // Non resettiamo lo scheduling se la card esiste già
    } else {
      // Crea una nuova card
      await ctx.db.insert("flashcards", {
        userId: userId,
        sourcePageId: args.sourcePageId,
        sourceBlockId: args.sourceBlockId,
        front: args.front,
        back: args.back,
        difficulty: NEW_CARD_DIFFICULTY,
        dueAt: Date.now(),
      });
    }
  },
});

/**
 * NUOVA MUTATION: Elimina una flashcard.
 */
export const deleteCard = mutation({
  args: { cardId: v.id("flashcards") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const card = await ctx.db.get(args.cardId);
    if (!card || card.userId !== identity.subject) {
      throw new Error("Card not found or unauthorized");
    }

    await ctx.db.delete(args.cardId);
  },
});


/**
 * Logica di business per la revisione SRS (MODIFICATA)
 * Rating: "wrong" | "right"
 */
export const reviewCard = mutation({
  args: {
    cardId: v.id("flashcards"),
    rating: v.union(v.literal("wrong"), v.literal("right")), // Nuovo rating
  },
  handler: async (ctx, { cardId, rating }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const card = await ctx.db.get(cardId);
    if (!card || card.userId !== identity.subject) throw new Error("Card not found");

    const currentDifficulty = card.difficulty;
    let newDifficulty: number;

    if (rating === "wrong") {
      newDifficulty = currentDifficulty + 1;
    } else { // rating === "right"
      newDifficulty = Math.max(0, currentDifficulty - 1); // Non scende sotto 0
    }

    const now = Date.now();
    let newDueAt = now;

    if (newDifficulty >= 3) { // Sbagliato
      newDueAt = now + NEW_CARD_INTERVAL_MINUTES * ONE_MINUTE_MS; // 1 min
    } else if (newDifficulty === 2) { // Difficile
      newDueAt = now + LEARNING_INTERVAL_MINUTES * ONE_MINUTE_MS; // 10 min
    } else if (newDifficulty === 1) { // OK
      newDueAt = now + OK_INTERVAL_DAYS * ONE_DAY_MS; // 1 Giorno
    } else { // newDifficulty === 0 (Facile)
      newDueAt = now + EASY_INTERVAL_DAYS * ONE_DAY_MS; // 4 Giorni
    }
    
    await ctx.db.patch(cardId, {
      difficulty: newDifficulty,
      dueAt: newDueAt,
    });
  },
});

/**
 * QUERY EFFICIENTE: Ottiene solo le carte scadute per un mazzo. (Invariata)
 */
export const listDueCards = query({
  args: {
    deckId: v.string(), // Può essere pageId o tagName
    deckType: v.union(v.literal("page"), v.literal("tag")),
  },
  handler: async (ctx, { deckId, deckType }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const now = Date.now();
    let q = ctx.db
      .query("flashcards")
      .withIndex("byUser", q => q.eq("userId", identity.subject)); // Inizia con indice User

    // Filtra per mazzo
    if (deckType === "page") {
      q = q.filter(q => q.eq(q.field("sourcePageId"), deckId));
    } else {
      q = q.filter(q => q.eq(q.field("tags"), deckId)); // TODO: Migliorare se i tag sono multipli
    }
    
    // Filtra per scadenza
    q = q.filter(q => q.lte(q.field("dueAt"), now));

    return await q.collect();
  },
});

/**
 * QUERY AGGREGATA: Efficienza massima per la Dashboard. (MODIFICATA)
 * Non restituisce le carte, solo i conteggi.
 */
export const getDeckSummaries = query({
  handler: async (ctx): Promise<DeckSummary[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;
    const now = Date.now();

    // 1. Ottieni TUTTE le card (veloce sul backend)
    const allCards = await ctx.db
      .query("flashcards")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .collect();

    // 2. Ottieni i metadati delle pagine (per i nomi dei mazzi)
    const allPages = await ctx.db
      .query("pages")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .collect();
    const pagesMap = new Map(allPages.map(p => [p._id, { name: p.title, icon: p.icon || "📄" }]));

    // 3. Aggrega i dati in una mappa
    const summaries = new Map<string, DeckSummary>();

    for (const card of allCards) {
      const deckId = card.sourcePageId;
      if (!summaries.has(deckId)) {
        const pageInfo = pagesMap.get(deckId);
        summaries.set(deckId, {
          deckId: deckId,
          deckName: pageInfo?.name || "Mazzo Sconosciuto",
          deckIcon: pageInfo?.icon || "📄",
          type: 'page',
          counts: { new: 0, learning: 0, review: 0, due: 0 },
        });
      }

      const summary = summaries.get(deckId)!;
      const isDue = card.dueAt <= now;
      const difficulty = card.difficulty;

      // Mappiamo la nuova 'difficulty' ai vecchi stati 'new', 'learning', 'review'
      if (difficulty === NEW_CARD_DIFFICULTY) {
        summary.counts.new++; // "Nuove" sono quelle con difficulty di default
      } else if (difficulty > NEW_CARD_DIFFICULTY || difficulty === 2) {
        summary.counts.learning++; // "In Appr." sono quelle difficili (2) o molto difficili (>3)
      } else { // difficulty 0 o 1
        summary.counts.review++; // "Review" sono quelle facili (0) / ok (1)
      }
      
      if (isDue) {
        summary.counts.due++;
      }
    }

    return Array.from(summaries.values());
  },
});