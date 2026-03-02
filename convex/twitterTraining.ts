import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ─────────────────────────────────────────────────────────

export const listDrafts = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("posted")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit }) => {
    if (status) {
      return await ctx.db
        .query("twitter_drafts")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit ?? 50);
    }
    return await ctx.db
      .query("twitter_drafts")
      .order("desc")
      .take(limit ?? 50);
  },
});

export const getAllFeedback = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("twitter_feedback")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit ?? 500);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allDrafts = await ctx.db.query("twitter_drafts").collect();
    const allFeedback = await ctx.db.query("twitter_feedback").collect();

    const total = allDrafts.length;
    const approved = allDrafts.filter((d) => d.status === "approved" || d.status === "posted").length;
    const rejected = allDrafts.filter((d) => d.status === "rejected").length;
    const pending = allDrafts.filter((d) => d.status === "draft").length;

    const categoryCount: Record<string, number> = {};
    for (const f of allFeedback) {
      categoryCount[f.category] = (categoryCount[f.category] || 0) + 1;
    }

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate: total > 0 ? Math.round((approved / (approved + rejected || 1)) * 100) : 0,
      totalFeedback: allFeedback.length,
      categoryBreakdown: categoryCount,
    };
  },
});

// ─── Mutations ───────────────────────────────────────────────────────

export const createDraft = mutation({
  args: {
    content: v.string(),
    suggestedTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("twitter_drafts", {
      content: args.content,
      status: "draft",
      suggestedTime: args.suggestedTime,
      createdAt: Date.now(),
    });
  },
});

export const updateDraftContent = mutation({
  args: {
    id: v.id("twitter_drafts"),
    content: v.string(),
  },
  handler: async (ctx, { id, content }) => {
    await ctx.db.patch(id, { content });
  },
});

export const approveDraft = mutation({
  args: { id: v.id("twitter_drafts") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "approved" });
  },
});

export const rejectDraft = mutation({
  args: { id: v.id("twitter_drafts") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "rejected" });
  },
});

export const submitFeedback = mutation({
  args: {
    draftId: v.optional(v.id("twitter_drafts")),
    feedback: v.string(),
    category: v.union(
      v.literal("tone"),
      v.literal("content"),
      v.literal("structure"),
      v.literal("general")
    ),
  },
  handler: async (ctx, args) => {
    // Store in permanent feedback table
    const feedbackId = await ctx.db.insert("twitter_feedback", {
      draftId: args.draftId,
      feedback: args.feedback,
      category: args.category,
      createdAt: Date.now(),
    });

    // Also attach to draft if linked
    if (args.draftId) {
      await ctx.db.patch(args.draftId, {
        feedback: args.feedback,
        feedbackAt: Date.now(),
      });
    }

    return feedbackId;
  },
});

export const deleteDraft = mutation({
  args: { id: v.id("twitter_drafts") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
