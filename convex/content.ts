import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("content")
      .order("desc")
      .take(limit ?? 50);
  },
});

export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, { status }) => {
    return await ctx.db
      .query("content")
      .withIndex("by_status", (q) => q.eq("status", status as "draft"))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("all")),
    pillar: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("content", {
      ...args,
      status: "draft",
      createdAt: Date.now(),
    });
  },
});

export const approve = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "approved",
      approvedAt: Date.now(),
    });
  },
});

export const markImageGenerating = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "image_generating" });
  },
});

export const setImageReady = mutation({
  args: { id: v.id("content"), imageUrl: v.string() },
  handler: async (ctx, { id, imageUrl }) => {
    await ctx.db.patch(id, {
      status: "ready",
      imageUrl,
    });
  },
});

export const publish = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "published",
      publishedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
