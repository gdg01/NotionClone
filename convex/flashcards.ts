// File: convex/flashcards.ts (NUOVO FILE)

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// --- COSTANTI SRS ---
const NEW_CARD_INTERVAL_MINUTES = 1; // 1 minuto per "Sbagliato"
const LEARNING_INTERVAL_MINUTES = 10; // 10 minuti per "Difficile" (in apprendimento)
const INITIAL_EASE_FACTOR = 2.5;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

// --- TIPI ---
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
 * Crea una nuova flashcard.
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
      
      // Valori SRS di default
      state: "new",
      dueAt: Date.now(), // Scaduta subito
      interval: 0, // In giorni
      easeFactor: INITIAL_EASE_FACTOR,
    });

    return cardId;
  },
});

/**
 * Aggiorna il testo di una flashcard (durante la revisione).
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
 * Crea o aggiorna una flashcard basata sulla sintassi (::)
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
    } else {
      // Crea una nuova card
      await ctx.db.insert("flashcards", {
        userId: userId,
        sourcePageId: args.sourcePageId,
        sourceBlockId: args.sourceBlockId,
        front: args.front,
        back: args.back,
        state: "new",
        dueAt: Date.now(),
        interval: 0,
        easeFactor: INITIAL_EASE_FACTOR,
      });
    }
  },
});


/**
 * Logica di business per la revisione SRS (Simplified SM-2)
 * Rating: 0 = Sbagliato, 1 = Difficile, 2 = OK, 3 = Facile
 */
export const reviewCard = mutation({
  args: {
    cardId: v.id("flashcards"),
    rating: v.number(), // 0, 1, 2, 3
  },
  handler: async (ctx, { cardId, rating }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const card = await ctx.db.get(cardId);
    if (!card || card.userId !== identity.subject) throw new Error("Card not found");

    let { state, interval, easeFactor } = card;
    const now = Date.now();
    let dueAt = now;

    if (rating === 0) { // Sbagliato / Again
      state = "learning";
      interval = 0; // Resetta l'intervallo
      dueAt = now + NEW_CARD_INTERVAL_MINUTES * ONE_MINUTE_MS; // Rivedi tra 1 min
    
    } else { // 1, 2, o 3
    
      if (state === "new") {
        state = "learning";
        if (rating === 1) { // Difficile
          interval = 0;
          dueAt = now + LEARNING_INTERVAL_MINUTES * ONE_MINUTE_MS; // Rivedi tra 10 min
        } else if (rating === 2) { // OK
          state = "review"; // Promuovi a review
          interval = 1; // 1 giorno
          dueAt = now + ONE_DAY_MS;
        } else { // Facile
          state = "review";
          interval = 4; // 4 giorni
          dueAt = now + 4 * ONE_DAY_MS;
        }
      } 
      
      else if (state === "learning") {
        if (rating === 1) { // Difficile
          interval = 0; // Rimane in learning
          dueAt = now + LEARNING_INTERVAL_MINUTES * ONE_MINUTE_MS;
        } else { // OK o Facile
          state = "review"; // Promuovi a review
          interval = 1; // 1 giorno
          dueAt = now + ONE_DAY_MS;
        }
      } 
      
      else if (state === "review") {
        // Aggiorna Ease Factor
        if (rating === 1) { // Difficile
          easeFactor = Math.max(1.3, easeFactor - 0.2);
        } else if (rating === 3) { // Facile
          easeFactor = easeFactor + 0.15;
        }
        // (rating === 2 'OK' non cambia easeFactor)

        // Calcola nuovo intervallo
        interval = Math.ceil(interval * easeFactor);
        dueAt = now + interval * ONE_DAY_MS;
      }
    }
    
    await ctx.db.patch(cardId, {
      state: state as Doc<"flashcards">["state"],
      interval,
      easeFactor,
      dueAt,
    });
  },
});

/**
 * QUERY EFFICIENTE: Ottiene solo le carte scadute per un mazzo.
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
 * QUERY AGGREGATA: Efficienza massima per la Dashboard.
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

      if (card.state === "new") {
        summary.counts.new++;
      } else if (card.state === "learning") {
        summary.counts.learning++;
      } else {
        summary.counts.review++;
      }
      
      if (isDue) {
        summary.counts.due++;
      }
    }

    return Array.from(summaries.values());
  },
});
