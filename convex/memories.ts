import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    return await ctx.db
      .query("memories")
      .order("desc")
      .take(limit);
  },
});

export const listByAgent = query({
  args: { agentId: v.id("agents"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("memories")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

export const listByCategory = query({
  args: { category: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("memories")
      .withIndex("by_category", (q) => q.eq("category", args.category as any))
      .order("desc")
      .take(limit);
  },
});

export const listCritical = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("memories")
      .withIndex("by_importance", (q) => q.eq("importance", "critical"))
      .order("desc")
      .take(limit);
  },
});

export const create = mutation({
  args: {
    agentId: v.id("agents"),
    content: v.string(),
    category: v.union(
      v.literal("decision"), v.literal("lesson"), v.literal("preference"),
      v.literal("task_outcome"), v.literal("insight"), v.literal("conversation"),
      v.literal("other")
    ),
    sessionId: v.optional(v.string()),
    importance: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memories", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Memories are append-only — no update or delete mutations
