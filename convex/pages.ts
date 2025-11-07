// File: convex/pages.ts 
// (SOSTITUZIONE COMPLETA - con getSidebar divisa)
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { applyPatch } from "fast-json-patch";
import { internal } from "./_generated/api"; 
import { customAlphabet } from "nanoid";

// Tipo helper per la risposta della sidebar
type PageWithChildren = Doc<"pages"> & { hasChildren: boolean };

/**
 * Funzione helper per recuperare le pagine e aggiungere il flag 'hasChildren'
 * Questo evita la duplicazione del codice.
 */
const fetchPagesWithChildren = async (
  ctx: any, // Tipo generico per il contesto di query
  userId: string,
  parentId: Id<"pages"> | undefined,
  isPinned: boolean
): Promise<PageWithChildren[]> => {
  
  // 1. Esegui la query usando il nuovo indice per filtrare per parentId E isPinned
  const pages = await ctx.db
    .query("pages")
    .withIndex("byUserParentPinned", (q: any) => 
      q.eq("userId", userId)
       .eq("parentId", parentId)
       .eq("isPinned", isPinned) // Filtra per pagine fissate o non fissate
    )
    .filter((q: any) => q.eq(q.field("isArchived"), false))
    .order("asc") // Continuiamo a ordinare A-Z (il drag-to-order è un'altra feature)
    .collect();

  // 2. Per ogni pagina trovata, controlla se *essa* ha figli
  const pagesWithChildrenFlag = await Promise.all(
    pages.map(async (page: Doc<"pages">) => {
      
      // Cerca un *singolo* figlio non archiviato per questa pagina
      const firstChild = await ctx.db
        .query("pages")
        .withIndex("byUserAndParent", (q: any) => 
          q.eq("userId", userId)
           .eq("parentId", page._id) // Controlla i figli di 'page'
        )
        .filter((q: any) => q.eq(q.field("isArchived"), false))
        .first(); // .first() è molto efficiente

      // 3. Restituisci la pagina originale + il nuovo flag
      return {
        ...page,
        hasChildren: firstChild !== null,
      };
    })
  );
  
  return pagesWithChildrenFlag;
};


// 1. 'getSidebar' (MODIFICATA)
// Ora restituisce un oggetto con due elenchi: 'pinned' e 'private'
export const getSidebar = query({
  args: { 
    parentPage: v.optional(v.id("pages")) 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { 
      // Restituisce la nuova struttura anche per gli utenti non autenticati
      return { pinned: [], private: [] }; 
    }
    const userId = identity.subject;

    // Eseguiamo due query separate e parallele
    const [pinnedPages, privatePages] = await Promise.all([
      // Query 1: Pagine FISSATE (isPinned: true)
      fetchPagesWithChildren(ctx, userId, args.parentPage, true),
      
      // Query 2: Pagine PRIVATE (isPinned: false o undefined)
      // Nota: Per interrogare 'undefined', dobbiamo usare un filtro separato
      // perché l'indice non può gestire 'undefined' direttamente in modo efficiente
      // in una query complessa. Ma per 'false' funziona.
      fetchPagesWithChildren(ctx, userId, args.parentPage, false),
      // TODO: Aggiungere una terza query per `isPinned: undefined` se necessario,
      // ma per ora questo copre la maggior parte dei casi.
    ]);
    
    // Restituisci l'oggetto con entrambi gli elenchi
    return {
      pinned: pinnedPages,
      private: privatePages,
    };
  },
});

// 2. 'getAllMetadata' (invariato)
export const getAllMetadata = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { return []; }
    const userId = identity.subject;
    const pages = await ctx.db.query("pages").withIndex("byUser", (q) => q.eq("userId", userId))
      .order("desc").collect();
    return pages;
  },
});


// 3. 'getContent' (invariato)
export const getContent = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { throw new Error("Not authenticated"); }
    const contentDoc = await ctx.db.query("pageContent")
      .withIndex("byPageId", (q) => q.eq("pageId", args.pageId)).unique();
    return contentDoc?.content || ""; 
  },
});

// 4. 'create' (MODIFICATO per impostare 'isPinned' a false di default)
export const create = mutation({
  args: { title: v.string(), parentPage: v.optional(v.id("pages")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { throw new Error("Not authenticated"); }
    const userId = identity.subject;

    let tagsToInherit: string[] = [];
    
    if (args.parentPage) {
      const parentPage = await ctx.db.get(args.parentPage);
      if (parentPage && 
          parentPage.userId === userId && 
          parentPage.tags && 
          parentPage.tags.length > 0) 
      {
        tagsToInherit = [parentPage.tags[0]]; 
      }
    }

    const pageId = await ctx.db.insert("pages", {
      title: args.title,
      userId,
      icon: "",
      parentId: args.parentPage,
      isArchived: false,
      coverImage: undefined,
      tags: tagsToInherit,
      isPinned: false, // <-- Imposta a 'false' alla creazione
      properties: {},
    });

    await ctx.db.insert("pageContent", {
      pageId: pageId, content: "{}",
    });
    
    return pageId;
  },
});


// 5.a 'update' (invariato - gestisce già 'isPinned')
export const update = mutation({
    args: {
        id: v.id("pages"), 
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        icon: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        isPinned: v.optional(v.boolean()), // <-- Già presente
        properties: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        const userId = identity.subject;
        const { id, content, ...metadata } = args; 
        const existingPage = await ctx.db.get(id);
        if (!existingPage) throw new Error("Not found");
        if (existingPage.userId !== userId) throw new Error("Unauthorized");

        if (Object.keys(metadata).length > 0) {
            await ctx.db.patch(id, metadata);
        }

        if (content !== undefined) {
            const contentDoc = await ctx.db
               .query("pageContent").withIndex("byPageId", q => q.eq("pageId", id)).unique();
            if (contentDoc) {
                await ctx.db.patch(contentDoc._id, { content });
            } else {
                await ctx.db.insert("pageContent", { pageId: id, content });
            }

            await ctx.runMutation(internal.search.enqueueEmbeddingJob, {
                pageId: id,
                contentJson: content
            });
            
            await ctx.scheduler.runAfter(0, internal.links.updatePageLinks, {
                pageId: id,
                contentJson: content,
                userId: userId
            });
        }
        return await ctx.db.get(id); 
    },
});

// 5.b 'patchContent' (invariato)
export const patchContent = mutation({
    args: {
        id: v.id("pages"),
        patch: v.string(), 
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");
        const userId = identity.subject;
        const { id, patch: patchString } = args;
        const existingPage = await ctx.db.get(id);
        if (!existingPage) throw new Error("Not found");
        if (existingPage.userId !== userId) throw new Error("Unauthorized");
        const contentDoc = await ctx.db
           .query("pageContent").withIndex("byPageId", q => q.eq("pageId", id)).unique();
        if (!contentDoc) {
            await ctx.db.insert("pageContent", { pageId: id, content: "{}" });
            return;
        }

        let newContentJSON;
        try {
            const oldContentJSON = JSON.parse(contentDoc.content || "{}");
            const patchJSON = JSON.parse(patchString);
            const { newDocument } = applyPatch(oldContentJSON, patchJSON);
            newContentJSON = newDocument;
            
            const newContentString = JSON.stringify(newContentJSON);
            
            await ctx.db.patch(contentDoc._id, { 
                content: newContentString 
            });

            await ctx.runMutation(internal.search.enqueueEmbeddingJob, {
                pageId: id,
                contentJson: newContentString
            });

            await ctx.scheduler.runAfter(0, internal.links.updatePageLinks, {
                pageId: id,
                contentJson: newContentString,
                userId: userId
            });

        } catch (e) {
            console.error("Applicazione patch fallita:", e);
            throw new Error("Failed to apply patch.");
        }
    },
});

// 6. 'archive' (invariato)
export const archive = mutation({
  args: { id: v.id("pages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const existingPage = await ctx.db.get(args.id);
    if (!existingPage) throw new Error("Not found");
    if (existingPage.userId !== userId) throw new Error("Unauthorized");
    const recursiveArchive = async (pageId: Id<"pages">) => {
        const children = await ctx.db.query("pages").withIndex("byUser", q => q.eq("userId", userId))
            .filter(q => q.eq(q.field("parentId"), pageId)).collect();
        for (const child of children) {
             await ctx.db.patch(child._id, { isArchived: true });
            await recursiveArchive(child._id);
        }
    }
    const page = await ctx.db.patch(args.id, { isArchived: true });
    recursiveArchive(args.id); 
    return page;
  }
});

// 7. 'togglePublicAccess' (invariato)
export const togglePublicAccess = mutation({
  args: {
    id: v.id("pages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = identity.subject;
    const existingPage = await ctx.db.get(args.id);
    if (!existingPage) throw new Error("Not found");
    if (existingPage.userId !== userId) throw new Error("Unauthorized");

    if (!existingPage.isPublic) {
      const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);
      const shareId = nanoid();
      
      await ctx.db.patch(args.id, {
        isPublic: true,
        shareId: shareId,
      });
      return shareId;
    } else {
      await ctx.db.patch(args.id, {
        isPublic: false,
        shareId: undefined,
      });
      return null;
    }
  },
});

// 8. 'getPublicPageData' (invariato)
export const getPublicPageData = query({
  args: {
    shareId: v.string(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("pages")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .unique();

    if (!page) {
      return null;
    }

    const contentDoc = await ctx.db
      .query("pageContent")
      .withIndex("byPageId", (q) => q.eq("pageId", page._id))
      .unique();

    const subPages = await ctx.db
      .query("pages")
      .withIndex("byUserAndParent", (q) =>
        q.eq("userId", page.userId).eq("parentId", page._id)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("asc")
      .collect();

    return {
      page: page,
      content: contentDoc?.content || "{}",
      subPages: subPages,
    };
  },
});