import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .collect();
  },
});

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"), v.literal("todo"), v.literal("in_progress"),
      v.literal("review"), v.literal("done"), v.literal("blocked")
    ),
    priority: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    assigneeIds: v.array(v.id("agents")),
    category: v.optional(v.string()),
    blocker: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("backlog"), v.literal("todo"), v.literal("in_progress"),
      v.literal("review"), v.literal("done"), v.literal("blocked")
    )),
    priority: v.optional(v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low"))),
    assigneeIds: v.optional(v.array(v.id("agents"))),
    category: v.optional(v.string()),
    blocker: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
