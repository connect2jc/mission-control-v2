import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const listByAgent = query({
  args: { agentId: v.id("agents"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("task_created"), v.literal("task_updated"), v.literal("task_completed"),
      v.literal("message_sent"), v.literal("agent_online"), v.literal("agent_offline"),
      v.literal("heartbeat"), v.literal("memory_saved"), v.literal("standup"),
      v.literal("consolidation"), v.literal("custom")
    ),
    agentId: v.optional(v.id("agents")),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
