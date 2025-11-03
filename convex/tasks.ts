// File: convex/tasks.ts (NUOVO FILE)

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';

/**
 * Definisce gli stati (colonne) validi per il Kanban.
 * Usare un Set/Map qui è utile per la validazione.
 */
const VALID_STATUSES = new Set(["todo", "inprogress", "done"]);

/**
 * Recupera tutti i task per l'utente autenticato.
 * Il frontend li userà per popolare la bacheca.
 */
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('byUser', (q) => q.eq('userId', userId))
      .order('desc') // Mostra i più recenti in cima
      .collect();
      
    return tasks;
  },
});

/**
 * Crea un nuovo task.
 * Richiede un titolo e una pageId a cui associarlo.
 * Di default, viene messo nello stato "todo".
 */
export const create = mutation({
  args: {
    title: v.string(),
    pageId: v.id('pages'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    const userId = identity.subject;

    // Verifica che la pagina esista e appartenga all'utente
    const page = await ctx.db.get(args.pageId);
    if (!page || page.userId !== userId) {
      throw new Error('Pagina non valida o non autorizzata');
    }

    const taskId = await ctx.db.insert('tasks', {
      title: args.title,
      pageId: args.pageId,
      userId: userId,
      status: 'todo', // Stato di default
    });

    return taskId;
  },
});

/**
 * Aggiorna lo stato di un task (usato per il drag-and-drop).
 */
export const updateStatus = mutation({
  args: {
    taskId: v.id('tasks'),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    // Validazione dello stato
    if (!VALID_STATUSES.has(args.newStatus)) {
      throw new Error('Stato non valido');
    }

    // Verifica i permessi
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Task non trovato o non autorizzato');
    }

    // Esegui l'aggiornamento
    await ctx.db.patch(args.taskId, {
      status: args.newStatus,
    });
  },
});

/**
 * Elimina un task.
 */
export const deleteTask = mutation({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Task non trovato o non autorizzato');
    }

    await ctx.db.delete(args.taskId);
  },
});