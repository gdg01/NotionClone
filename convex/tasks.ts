// File: convex/tasks.ts (SOSTITUZIONE COMPLETA)

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';

const VALID_STATUSES = new Set(["todo", "inprogress", "done"]);

export const list = query({
  handler: async (ctx) => {
    // ... (logica invariata) ...
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('byUser', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
      
    return tasks;
  },
});


/**
 * Crea un nuovo task.
 * AGGIORNATO: Accetta 'description' opzionale E 'status' obbligatorio.
 */
export const create = mutation({
  args: {
    title: v.string(),
    pageId: v.id('pages'),
    description: v.optional(v.string()), 
    status: v.string(), // <-- ARGOMENTO AGGIUNTO E RICHIESTO DAL FRONTEND
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    const userId = identity.subject;

    const page = await ctx.db.get(args.pageId);
    if (!page || page.userId !== userId) {
      throw new Error('Pagina non valida o non autorizzata');
    }
    
    // Validazione dello status
    if (!VALID_STATUSES.has(args.status)) {
        throw new Error('Stato iniziale del task non valido');
    }

    const taskId = await ctx.db.insert('tasks', {
      title: args.title,
      pageId: args.pageId,
      userId: userId,
      // Lo status ora viene preso dagli args, non è hardcodato a 'todo'
      status: args.status as Doc<'tasks'>['status'], 
      description: args.description,
    });

    return taskId;
  },
});
export const updateStatus = mutation({
  args: {
    taskId: v.id('tasks'),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    // ... (logica invariata) ...
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    if (!VALID_STATUSES.has(args.newStatus)) {
      throw new Error('Stato non valido');
    }
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Task non trovato o non autorizzato');
    }
    await ctx.db.patch(args.taskId, {
      status: args.newStatus,
    });
  },
});

export const deleteTask = mutation({
  args: {
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    // ... (logica invariata) ...
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