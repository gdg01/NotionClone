// File: convex/graph.ts (MODIFICATO per includere _creationTime)

import { query } from './_generated/server';
import { v } from 'convex/values';

export const getGraphData = query({
  args: {},
  handler: async (ctx) => {
    // ... (Codice 0, 1, 2, 3 invariato) ...

    // 1. Ottieni tutti i nodi (Pagine) dell'utente NON archiviate
    const pages = await ctx.db
      .query('pages')
      .withIndex('byUser', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isArchived'), false))
      .collect();

    // 2. Ottieni tutti gli archi (Links) dell'utente
    const links = await ctx.db
      .query('backlinks')
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect();

    // 3. Calcola il conteggio dei link per ogni nodo (invariato)
    const linkCounts = new Map<string, number>();
    for (const link of links) {
      linkCounts.set(link.sourcePageId, (linkCounts.get(link.sourcePageId) || 0) + 1);
      linkCounts.set(link.targetPageId, (linkCounts.get(link.targetPageId) || 0) + 1);
    }

    // 4. Crea un Set di ID delle pagine visibili (invariato)
    const visiblePageIds = new Set(pages.map(p => p._id));

    // 5. Formatta i nodi (MODIFICATO)
    const nodes = pages.map((page) => ({
      id: page._id,
      label: page.title || 'Untitled',
      icon: page.icon || '📄',
      tags: page.tags || [],
      isPinned: page.isPinned || false,
      linkCount: linkCounts.get(page._id) || 0,
      createdAt: page._creationTime // <-- AGGIUNTA CHIAVE
    }));

    // 6. Filtra i link (MODIFICATO)
    const edges = links
      .filter(link => 
        visiblePageIds.has(link.sourcePageId) && 
        visiblePageIds.has(link.targetPageId)
      )
      .map((link) => ({
        source: link.sourcePageId,
        target: link.targetPageId,
        createdAt: link._creationTime // <-- AGGIUNTA CHIAVE
      }));

    // 7. Rimuovi duplicati (invariato)
    const uniqueEdges = Array.from(
      new Map(
        edges.map((e) => [`${e.source}-${e.target}`, e])
      ).values()
    );

    // 8. Restituisci i dati arricchiti
    return {
      nodes,
      links: uniqueEdges,
    };
  },
});