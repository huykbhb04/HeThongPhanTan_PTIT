import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    initialContent: v.optional(v.string()),
    ownerId: v.string(),
    roomId: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    // Cấu hình quyền truy cập qua link ("viewer", "editor" hoặc "none")
    linkAccess: v.optional(v.union(v.literal("viewer"), v.literal("editor"), v.literal("none"))),
    // Danh sách những người được chia sẻ riêng
    collaborators: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          role: v.union(v.literal("viewer"), v.literal("editor")),
        })
      )
    ),
    lastSavedAt: v.optional(v.number()),
  })
    .index("by_owner_id", ["ownerId"])
    .index("by_organization_id", ["organizationId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["ownerId", "organizationId"],
    }),
});
