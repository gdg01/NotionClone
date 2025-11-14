// File: convex/graph.ts 
// (SOSTITUZIONE COMPLETA - Con aggiunta link Parent/Child)

import { query } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel'; // Importa Id

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

    // 2. Ottieni TUTTI i link di contenuto (Backlinks)
    const links = await ctx.db
      .query('backlinks')
      .collect();

    // 3. Calcola il conteggio dei link
    const linkCounts = new Map<string, number>();
    for (const link of links) {
      linkCounts.set(link.sourcePageId, (linkCounts.get(link.sourcePageId) || 0) + 1);
      // --- (Correzione bug originale) ---
      linkCounts.set(link.targetPageId, (linkCounts.get(link.targetPageId) || 0) + 1);
    }
    
    // 4. Crea un Set di ID delle pagine visibili
    const visiblePageIds = new Set(pages.map(p => p._id));

    
    // --- LOGICA DI NORMALIZZAZIONE E UNIONE LINK ---

    // 5a. Filtra i link di CONTENUTO (backlinks) in base alle pagine visibili
    //     (Rinominato da validLinks a contentLinks per chiarezza)
    const contentLinks = links.filter(link => 
      visiblePageIds.has(link.sourcePageId) && 
      visiblePageIds.has(link.targetPageId)
    );

    // --- INIZIO MODIFICA: Aggiungi link Parent/Child ---
    
    // 5b. Crea i link GERARCHICI (genitore/figlio)
    //     Vengono trattati come link normali per l'ordinamento e la visualizzazione.
    const parentChildLinks: Doc<'backlinks'>[] = [];
    for (const page of pages) {
      // Se la pagina ha un genitore E il genitore è visibile...
      if (page.parentId && visiblePageIds.has(page.parentId)) {
        
        // Aggiungi un link virtuale dall'array.
        // Usiamo il _creationTime della pagina FIGLIA per l'animazione.
        parentChildLinks.push({
          _id: `parent_${page._id}` as Id<'backlinks'>, // ID fittizio per la mappatura
          _creationTime: page._creationTime,
          sourcePageId: page.parentId,
          targetPageId: page._id,
          userId: page.userId,
          snippet: "Relazione Genitore/Figlio", // Non usato nel grafo, ma utile per il tipo
          // targetBlockId è opzionale e qui non serve
        });
      }
    }
    
    // 5c. Unisci i due tipi di link
    //     (Il tipo Doc<'backlinks'> è compatibile con i nostri link virtuali)
    const allValidLinks: Doc<'backlinks'>[] = [
      ...contentLinks, 
      ...parentChildLinks
    ];
    
    // --- FINE MODIFICA ---


    // 5d. Combina pagine e TUTTI i link validi in un unico array
    type SortableItem = 
      | { type: 'node', data: Doc<'pages'> }
      | { type: 'link', data: Doc<'backlinks'> }; // Ora usa il tipo Doc

    const allItems: SortableItem[] = [
      ...pages.map(page => ({ type: 'node' as const, data: page })),
      ...allValidLinks.map(link => ({ type: 'link' as const, data: link })) // <-- USA allValidLinks
    ];

    // 5e. Ordina l'array combinato per data di creazione
    allItems.sort((a, b) => a.data._creationTime - b.data._creationTime);

    // 5f. Crea gli array finali, assegnando l'indice come "animationStep"
    const nodes: any[] = [];
    const edges: any[] = [];

    allItems.forEach((item, index) => {
      const animationStep = index; // Il nostro "passo" normalizzato

      if (item.type === 'node') {
        const page = item.data;
        nodes.push({
          id: page._id,
          label: page.title || 'Untitled',
          icon: page.icon || '📄',
          tags: page.tags || [],
          isPinned: page.isPinned || false,
          linkCount: linkCounts.get(page._id) || 0, // Nota: questo conteggio si basa solo sui 'backlinks'
          createdAt: page._creationTime,
          animationStep: animationStep
        });
      } else if (item.type === 'link') {
        const link = item.data;
        edges.push({
          source: link.sourcePageId,
          target: link.targetPageId,
          createdAt: link._creationTime,
          animationStep: animationStep
        });
      }
    });

    // --- FINE LOGICA ---

    // 6. Rimuovi duplicati 
    //    (Questo ora gestisce anche i casi in cui un link di contenuto
    //     e un link gerarchico esistono tra gli stessi due nodi, 
    //     mostrandone solo uno, che è il comportamento desiderato)
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