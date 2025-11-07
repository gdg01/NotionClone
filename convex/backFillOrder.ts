// File: convex/backfillOrder.ts
// (NUOVO FILE - Esegui una volta dal dashboard Convex)
import { internalMutation } from "./_generated/server";

export const backfillPageOrder = internalMutation({
  handler: async (ctx) => {
    // 1. Prendi tutte le pagine
    const pages = await ctx.db.query("pages").fullTableScan().collect();
    
    let updatedCount = 0;
    
    // 2. Itera su ogni pagina
    for (const page of pages) {
      // 3. Se 'order' è nullo o non definito
      if (page.order === null || page.order === undefined) {
        // 4. Impostalo usando il _creationTime per mantenere l'ordine esistente
        await ctx.db.patch(page._id, {
          order: page._creationTime 
        });
        updatedCount++;
      }
      
      // Bonus: Assicurati che 'isPinned' sia definito
      if (page.isPinned === undefined) {
          await ctx.db.patch(page._id, { isPinned: false });
      }
    }
    
    return `Backfill completato. ${updatedCount} pagine aggiornate con un 'order' di default.`;
  },
});