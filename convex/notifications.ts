import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUndelivered = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_mentioned", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("notifications")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const create = mutation({
  args: {
    mentionedAgentId: v.id("agents"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      delivered: false,
      createdAt: Date.now(),
    });
  },
});

export const markDelivered = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { delivered: true });
  },
});

export const markAllDelivered = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const undelivered = await ctx.db
      .query("notifications")
      .withIndex("by_mentioned", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("delivered", false)
      )
      .collect();
    for (const notif of undelivered) {
      await ctx.db.patch(notif._id, { delivered: true });
    }
  },
});
