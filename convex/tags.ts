// File: convex/tags.ts (NUOVO FILE)

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Elenca tutti i tag unici creati dall'utente.
 * Il frontend lo userà per l'autocomplete e per mappare nomi a colori.
 */
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { return []; }

    const tags = await ctx.db
      .query('tags')
      .withIndex('byUserAndName', q => q.eq('userId', identity.subject))
      .order('asc')
      .collect();
      
    return tags;
  },
});

/**
 * Logica "Get or Create".
 * Chiamato dal frontend quando un utente aggiunge un tag.
 * Se il tag esiste, lo restituisce.
 * Se non esiste, lo crea con il colore fornito (o 'gray' di default).
 */
export const getOrCreate = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()), // L'utente può specificare un colore in creazione
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { throw new Error('Unauthenticated'); }
    const userId = identity.subject;
    
    // Normalizza il nome del tag (lowercase, no spazi extra)
    const tagName = args.name.trim().toLowerCase();
    if (tagName.length === 0) {
      throw new Error('Tag name cannot be empty');
    }

    // 1. Cerca se esiste già
    const existingTag = await ctx.db
      .query('tags')
      .withIndex('byUserAndName', q => q.eq('userId', userId).eq('name', tagName))
      .unique();
      
    if (existingTag) {
      return existingTag; // Trovato, restituisci
    }

    // 2. Se non trovato, crea
    const newTagId = await ctx.db.insert('tags', {
      userId,
      name: tagName,
      color: args.color || 'gray', // Default a 'gray'
    });
    
    return await ctx.db.get(newTagId);
  },
});

/**
 * Permette all'utente di cambiare il colore di un tag esistente.
 */
export const updateColor = mutation({
  args: {
    tagId: v.id('tags'),
    color: v.string(), // Il nuovo nome del colore (es. "red")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { throw new Error('Unauthenticated'); }
    
    const existingTag = await ctx.db.get(args.tagId);
    if (!existingTag) {
      throw new Error('Tag not found');
    }
    
    // Verifica i permessi
    if (existingTag.userId !== identity.subject) {
      throw new Error('Unauthorized');
    }
    
    // Esegui l'aggiornamento
    await ctx.db.patch(existingTag._id, {
      color: args.color,
    });
  },
});