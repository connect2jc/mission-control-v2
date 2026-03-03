import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    return await ctx.db
      .query("karma")
      .order("desc")
      .take(limit);
  },
});

export const listByAgent = query({
  args: { agentId: v.id("agents"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("karma")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

export const getLeaderboard = query({
  handler: async (ctx) => {
    const allKarma = await ctx.db.query("karma").collect();
    const totals = new Map<string, { agentId: string; agentName: string; total: number }>();

    for (const k of allKarma) {
      const existing = totals.get(k.agentName) || { agentId: k.agentId, agentName: k.agentName, total: 0 };
      existing.total += k.points;
      totals.set(k.agentName, existing);
    }

    return [...totals.values()].sort((a, b) => b.total - a.total);
  },
});

export const award = mutation({
  args: {
    agentId: v.id("agents"),
    agentName: v.string(),
    points: v.number(),
    earnedFrom: v.optional(v.id("tasks")),
    type: v.union(v.literal("build"), v.literal("qc"), v.literal("assist")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("karma", {
      ...args,
      earnedAt: Date.now(),
    });
  },
});

export const awardForTaskCompletion = mutation({
  args: {
    agentId: v.id("agents"),
    agentName: v.string(),
    taskId: v.id("tasks"),
    taskTitle: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("karma", {
      agentId: args.agentId,
      agentName: args.agentName,
      points: 10,
      earnedFrom: args.taskId,
      earnedAt: Date.now(),
      type: "build",
      reason: `Completed task: ${args.taskTitle}`,
    });
  },
});

export const awardForQCApproval = mutation({
  args: {
    qcAgentId: v.id("agents"),
    qcAgentName: v.string(),
    builderAgentId: v.id("agents"),
    builderAgentName: v.string(),
    taskId: v.id("tasks"),
    taskTitle: v.string(),
  },
  handler: async (ctx, args) => {
    // +5 to QC agent
    await ctx.db.insert("karma", {
      agentId: args.qcAgentId,
      agentName: args.qcAgentName,
      points: 5,
      earnedFrom: args.taskId,
      earnedAt: Date.now(),
      type: "qc",
      reason: `QC approved: ${args.taskTitle}`,
    });

    // +5 bonus to builder
    await ctx.db.insert("karma", {
      agentId: args.builderAgentId,
      agentName: args.builderAgentName,
      points: 5,
      earnedFrom: args.taskId,
      earnedAt: Date.now(),
      type: "build",
      reason: `QC bonus for: ${args.taskTitle}`,
    });
  },
});
