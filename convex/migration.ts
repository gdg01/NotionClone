// convex/migrate.ts (NUOVO FILE)
import { internalMutation } from "./_generated/server";

export const migrateData = internalMutation({
  handler: async (ctx) => {
    // 1. Prendi tutte le pagine esistenti (con il vecchio campo 'content') [cite: 33]
    const pages = await ctx.db.query("pages").fullTableScan().collect();

    let migratedCount = 0;
    let skippedCount = 0;
    console.log(`[Migrazione] Trovate ${pages.length} pagine da controllare...`);

    for (const page of pages) {
      // 2. Controlla se la pagina ha del contenuto [cite: 33]
      if (page.content && page.content.trim() !== "" && page.content.trim() !== "{}") {
     
        // 3. Controlla se abbiamo GIÀ migrato questa pagina (per sicurezza) [cite: 34]
        const existing = await ctx.db
          .query("pageContent")
          .withIndex("byPageId", (q) => q.eq("pageId", page._id))
          .unique();

        if (existing) {
          skippedCount++;
        } else {
   
           // 4. Copia il contenuto nella nuova tabella 'pageContent' [cite: 35]
          await ctx.db.insert("pageContent", {
            pageId: page._id,
            content: page.content,
          });
          migratedCount++;
        }
      } else {
        // Pagina senza contenuto, salta
        skippedCount++;
      }
    }

    const result = `[Migrazione] Completata.
    ${migratedCount} pagine migrate, ${skippedCount} pagine saltate (vuote o già migrate).`; 
    console.log(result);
    return result;
  },
});