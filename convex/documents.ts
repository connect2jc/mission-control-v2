import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("documents")
        .withIndex("by_type", (q) => q.eq("type", args.type as any))
        .collect();
    }
    return await ctx.db.query("documents").collect();
  },
});

export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("prd"), v.literal("report"), v.literal("plan"), v.literal("note"), v.literal("other")),
    taskId: v.optional(v.id("tasks")),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});
