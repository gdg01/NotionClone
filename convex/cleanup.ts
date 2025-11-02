// convex/cleanup.ts (NUOVO FILE)
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const cleanupData = internalMutation({
  handler: async (ctx) => {
    // 1. Prendi tutte le pagine
    const pages = await ctx.db.query("pages").fullTableScan().collect();

    let cleanedCount = 0;
    console.log(`[Pulizia] Trovate ${pages.length} pagine da pulire...`);

    for (const page of pages) {
      // 2. Se la pagina ha ancora il vecchio campo 'content'
      if (page.content !== undefined) {
        
        // 3. Rimuovi il campo 'content' inviando 'undefined'
        await ctx.db.patch(page._id, {
          content: undefined 
        });
        cleanedCount++;
      }
    }

    const result = `[Pulizia] Completata. ${cleanedCount} pagine pulite.`;
    console.log(result);
    return result;
  },
});