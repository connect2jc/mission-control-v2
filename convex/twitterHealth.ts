import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const push = mutation({
  args: {
    followers: v.number(),
    following: v.number(),
    avgViews: v.number(),
    zeroViewTweets: v.number(),
    searchVisible: v.boolean(),
    status: v.union(v.literal("healthy"), v.literal("degraded"), v.literal("banned")),
    issues: v.array(v.string()),
    cookieAgeDays: v.number(),
    dailyReplies: v.number(),
    dailyLikes: v.number(),
    dailyRetweets: v.number(),
    queuePending: v.number(),
    queueSent: v.number(),
    queueError: v.number(),
    cooloffActive: v.boolean(),
    cooloffUntil: v.optional(v.string()),
    cooloffReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("twitter_health", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const latest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("twitter_health")
      .withIndex("by_createdAt")
      .order("desc")
      .first();
  },
});

export const history = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("twitter_health")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});
