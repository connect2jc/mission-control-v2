import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    emoji: v.string(),
    status: v.union(v.literal("idle"), v.literal("working"), v.literal("offline"), v.literal("error")),
    model: v.optional(v.string()),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agents", {
      ...args,
      lastHeartbeat: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(v.literal("idle"), v.literal("working"), v.literal("offline"), v.literal("error")),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      currentTaskId: args.currentTaskId,
      lastHeartbeat: Date.now(),
    });
  },
});

export const setCurrentTask = mutation({
  args: {
    id: v.id("agents"),
    currentTask: v.string(),
    currentStatus: v.optional(v.union(v.literal("working"), v.literal("idle"), v.literal("blocked"))),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      currentTask: args.currentTask,
      currentStatus: args.currentStatus ?? "working",
      lastHeartbeat: Date.now(),
    });
  },
});

export const heartbeat = mutation({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastHeartbeat: Date.now() });
  },
});
