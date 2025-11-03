// File: convex/graph.ts (Versione con animazione normalizzata - Corretta)

import { query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';

export const getGraphData = query({
  args: {},
  handler: async (ctx) => {
    
    // 0. Ottieni l'identità dell'utente
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Utente non autenticato.');
    }
    const userId = identity.subject; 

    // 1. Ottieni tutti i nodi (Pagine)
    const pages = await ctx.db
      .query('pages')
      .withIndex('byUser', (q) => q.eq('userId', userId)) 
      .filter((q) => q.eq(q.field('isArchived'), false))
      .collect();

    // 2. Ottieni TUTTI i link
    const links = await ctx.db
      .query('backlinks')
      .collect();

    // 3. Calcola il conteggio dei link
    const linkCounts = new Map<string, number>();
    for (const link of links) {
      linkCounts.set(link.sourcePageId, (linkCounts.get(link.sourcePageId) || 0) + 1);
      // --- 🔴 ECCO LA CORREZIONE 🔴 ---
      linkCounts.set(link.targetPageId, (linkCounts.get(link.targetPageId) || 0) + 1);
    }

    // 4. Crea un Set di ID delle pagine visibili
    const visiblePageIds = new Set(pages.map(p => p._id));

    
    // --- NUOVA LOGICA DI NORMALIZZAZIONE ---

    // 5a. Filtra i link in base alle pagine visibili (come prima)
    const validLinks = links.filter(link => 
      visiblePageIds.has(link.sourcePageId) && 
      visiblePageIds.has(link.targetPageId)
    );

    // 5b. Combina pagine e link validi in un unico array
    type SortableItem = 
      | { type: 'node', data: Doc<'pages'> }
      | { type: 'link', data: Doc<'backlinks'> };

    const allItems: SortableItem[] = [
      ...pages.map(page => ({ type: 'node' as const, data: page })),
      ...validLinks.map(link => ({ type: 'link' as const, data: link }))
    ];

    // 5c. Ordina l'array combinato per data di creazione
    allItems.sort((a, b) => a.data._creationTime - b.data._creationTime);

    // 5d. Crea gli array finali, assegnando l'indice come "animationStep"
    const nodes: any[] = [];
    const edges: any[] = [];

    allItems.forEach((item, index) => {
      const animationStep = index; // <-- Il nostro "passo" normalizzato

      if (item.type === 'node') {
        const page = item.data;
        nodes.push({
          id: page._id,
          label: page.title || 'Untitled',
          icon: page.icon || '📄',
          tags: page.tags || [],
          isPinned: page.isPinned || false,
          linkCount: linkCounts.get(page._id) || 0,
          createdAt: page._creationTime, // Lo teniamo, può servire
          animationStep: animationStep   // <-- IL NUOVO CAMPO
        });
      } else if (item.type === 'link') {
        const link = item.data;
        edges.push({
          source: link.sourcePageId,
          target: link.targetPageId,
          createdAt: link._creationTime,
          animationStep: animationStep   // <-- IL NUOVO CAMPO
        });
      }
    });

    // --- FINE NUOVA LOGICA ---

    // 6. Rimuovi duplicati (come prima)
    const uniqueEdges = Array.from(
      new Map(
        edges.map((e) => [`${e.source}-${e.target}`, e])
      ).values()
    );

    // 7. Restituisci i dati
    return {
      nodes,
      links: uniqueEdges,
    };
  },
});