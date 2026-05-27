import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { mutation, query } from "./_generated/server";

export const getByIds = query({
  args: { ids: v.array(v.id("documents")) },
  handler: async (ctx, { ids }) => {
    const documents = [];

    for (const id of ids) {
      const document = await ctx.db.get(id);

      if (document) {
        documents.push({ id: document._id, name: document.title });
      } else {
        documents.push({ id, name: "[Removed]" });
      }
    }

    return documents;
  },
});

export const create = mutation({
  args: { title: v.optional(v.string()), initialContent: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const organizationId = (user.organization_id ?? undefined) as string | undefined;

    return ctx.db.insert("documents", {
      title: args.title ?? "Untitled document",
      ownerId: user.subject,
      organizationId,
      initialContent: args.initialContent,
      linkAccess: "editor", 
    });
  },
});

export const get = query({
  args: { paginationOpts: paginationOptsValidator, search: v.optional(v.string()) },
  handler: async (ctx, { search, paginationOpts }) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const organizationId = (user.organization_id ?? undefined) as string | undefined;

    if (search && organizationId) {
      return ctx.db
        .query("documents")
        .withSearchIndex("search_title", (q) =>
          q.search("title", search).eq("organizationId", organizationId)
        )
        .paginate(paginationOpts);
    }

    if (search) {
      return await ctx.db
        .query("documents")
        .withSearchIndex("search_title", (q) => {
          return q.search("title", search).eq("ownerId", user.subject);
        })
        .paginate(paginationOpts);
    }

    if (organizationId) {
      return await ctx.db
        .query("documents")
        .withIndex("by_organization_id", (q) => q.eq("organizationId", organizationId))
        .paginate(paginationOpts);
    }

    return await ctx.db
      .query("documents")
      .withIndex("by_owner_id", (q) => q.eq("ownerId", user.subject))
      .paginate(paginationOpts);
  },
});

export const removeById = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const organizationId = (user.organization_id ?? undefined) as string | undefined;

    const document = await ctx.db.get(args.id);

    if (!document) {
      throw new ConvexError("Document not found");
    }

    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember = !!(
      document.organizationId && document.organizationId === organizationId
    );
    if (!isOwner && !isOrganizationMember) {
      throw new ConvexError("Unauthorized");
    }

    return await ctx.db.delete(args.id);
  },
});

export const updateById = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const organizationId = (user.organization_id ?? undefined) as string | undefined;

    const document = await ctx.db.get(args.id);

    if (!document) {
      throw new ConvexError("Document not found");
    }

    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember = !!(
      document.organizationId && document.organizationId === organizationId
    );

    const collaborator = document.collaborators?.find((c) => c.userId === user.subject);
    const isEditor = collaborator?.role === "editor" || document.linkAccess === "editor";

    if (!isOwner && !isOrganizationMember && !isEditor) {
      throw new ConvexError("Unauthorized");
    }

    return await ctx.db.patch(args.id, { title: args.title });
  },
});

// Query lấy document KHÔNG check auth để Liveblocks Server Route gọi
export const getByIdForAuth = query({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const document = await ctx.db.get(id);
    if (!document) {
      throw new ConvexError("Document not found");
    }
    return document;
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const document = await ctx.db.get(id);

    if (!document) {
      throw new ConvexError("Document not found");
    }

    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const organizationId = (user.organization_id ?? undefined) as string | undefined;
    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember = !!(
      document.organizationId && document.organizationId === organizationId
    );

    const collaborator = document.collaborators?.find((c) => c.userId === user.subject);
    const hasLinkAccess = document.linkAccess === "editor" || document.linkAccess === "viewer";

    if (!isOwner && !isOrganizationMember && !collaborator && !hasLinkAccess) {
      throw new ConvexError("Unauthorized");
    }

    return document;
  },
});

export const saveContent = mutation({
  args: {
    id: v.id("documents"),
    content: v.string(), 
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("Unauthorized");
    }

    const document = await ctx.db.get(args.id);

    if (!document) {
      throw new ConvexError("Document not found");
    }

    const organizationId = (user.organization_id ?? undefined) as string | undefined;
    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember = !!(
      document.organizationId && document.organizationId === organizationId
    );

    const collaborator = document.collaborators?.find((c) => c.userId === user.subject);
    const isEditor = collaborator?.role === "editor" || document.linkAccess === "editor";

    if (!isOwner && !isOrganizationMember && !isEditor) {
      throw new ConvexError("Unauthorized");
    }

    return await ctx.db.patch(args.id, {
      initialContent: args.content,
      lastSavedAt: Date.now(),
    });
  },
});

export const updateLinkAccess = mutation({
  args: { id: v.id("documents"), linkAccess: v.union(v.literal("viewer"), v.literal("editor"), v.literal("none")) },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    const document = await ctx.db.get(args.id);
    if (!document) throw new ConvexError("Document not found");

    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember = !!(document.organizationId && document.organizationId === (user.organization_id ?? undefined));
    if (!isOwner && !isOrganizationMember) throw new ConvexError("Unauthorized");

    return await ctx.db.patch(args.id, { linkAccess: args.linkAccess });
  },
});

export const addCollaborator = mutation({
  args: { id: v.id("documents"), userId: v.string(), role: v.union(v.literal("viewer"), v.literal("editor")) },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    const document = await ctx.db.get(args.id);
    if (!document) throw new ConvexError("Document not found");

    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember = !!(document.organizationId && document.organizationId === (user.organization_id ?? undefined));
    if (!isOwner && !isOrganizationMember) throw new ConvexError("Unauthorized");

    const collaborators = document.collaborators || [];
    const existingIndex = collaborators.findIndex(c => c.userId === args.userId);
    if (existingIndex !== -1) {
      collaborators[existingIndex].role = args.role;
    } else {
      collaborators.push({ userId: args.userId, role: args.role });
    }

    return await ctx.db.patch(args.id, { collaborators });
  },
});

export const removeCollaborator = mutation({
  args: { id: v.id("documents"), userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    const document = await ctx.db.get(args.id);
    if (!document) throw new ConvexError("Document not found");

    const isOwner = document.ownerId === user.subject;
    const isOrganizationMember = !!(document.organizationId && document.organizationId === (user.organization_id ?? undefined));
    if (!isOwner && !isOrganizationMember) throw new ConvexError("Unauthorized");

    const collaborators = (document.collaborators || []).filter(c => c.userId !== args.userId);
    return await ctx.db.patch(args.id, { collaborators });
  },
});
