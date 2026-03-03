import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
  args: {
    id: v.id("content"),
    imageUrl: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { id, imageUrl, imageStorageId }) => {
    await ctx.db.patch(id, {
      status: "ready",
      imageUrl,
      ...(imageStorageId ? { imageStorageId } : {}),
    });
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

export const generateImage = action({
  args: { id: v.id("content"), text: v.string(), pillar: v.optional(v.string()) },
  handler: async (ctx, { id, text, pillar }) => {
    // Mark as generating
    await ctx.runMutation(api.content.markImageGenerating, { id });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    // Build a prompt for a compelling social media image
    const prompt = `Create a visually striking, modern social media image for this tweet.
Style: Clean, minimal, dark background with bold typography or abstract visuals.
Category: ${pillar || "general"}.
Tweet: "${text.slice(0, 300)}"
Do NOT include any text in the image. Make it abstract, atmospheric, and eye-catching.`;

    // Call Gemini image generation API (same format as Nano Banana Pro)
    const model = "gemini-2.0-flash-exp-image-generation";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      const parsed = (() => { try { return JSON.parse(err); } catch { return null; } })();
      const msg = parsed?.error?.message || err.slice(0, 150);
      // Revert to approved so user can retry
      await ctx.runMutation(api.content.revertToApproved, { id, error: msg });
      return;
    }

    const data = await response.json();

    // Extract base64 image from response
    let imageBase64: string | null = null;
    let mimeType = "image/png";

    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
          break;
        }
      }
      if (imageBase64) break;
    }

    if (!imageBase64) {
      await ctx.runMutation(api.content.revertToApproved, { id, error: "No image in Gemini response" });
      return;
    }

    // Convert base64 to binary and store in Convex
    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: mimeType });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);

    await ctx.runMutation(api.content.setImageReady, {
      id,
      imageUrl: url || `storage:${storageId}`,
      imageStorageId: storageId,
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

export const revertToApproved = mutation({
  args: { id: v.id("content"), error: v.string() },
  handler: async (ctx, { id, error }) => {
    await ctx.db.patch(id, {
      status: "approved",
      imageUrl: `error: ${error}`,
    });
  },
});

export const reject = mutation({
  args: { id: v.id("content"), feedback: v.optional(v.string()) },
  handler: async (ctx, { id, feedback }) => {
    await ctx.db.patch(id, {
      status: "rejected",
      ...(feedback ? { feedback, feedbackAt: Date.now() } : {}),
    });
  },
});

export const addFeedback = mutation({
  args: { id: v.id("content"), feedback: v.string() },
  handler: async (ctx, { id, feedback }) => {
    await ctx.db.patch(id, {
      feedback,
      feedbackAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
