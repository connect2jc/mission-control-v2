import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("crons").collect();
  },
});

export const listEnabled = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("crons")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();
  },
});

export const listFailed = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("crons")
      .withIndex("by_lastStatus", (q) => q.eq("lastStatus", "error"))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    jobId: v.string(),
    name: v.string(),
    agentId: v.optional(v.string()),
    enabled: v.boolean(),
    schedule: v.string(),
    timezone: v.optional(v.string()),
    description: v.optional(v.string()),
    payload: v.optional(v.string()),
    lastRunAt: v.optional(v.number()),
    lastStatus: v.union(
      v.literal("ok"),
      v.literal("error"),
      v.literal("timeout"),
      v.literal("never")
    ),
    lastError: v.optional(v.string()),
    lastDurationMs: v.optional(v.number()),
    consecutiveErrors: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("crons")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("crons", {
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});

// ── Cron Logs ───────────────────────────────────────────────────────

export const addLog = mutation({
  args: {
    jobId: v.string(),
    status: v.union(v.literal("ok"), v.literal("error"), v.literal("timeout")),
    durationMs: v.optional(v.number()),
    error: v.optional(v.string()),
    output: v.optional(v.string()),
    summary: v.optional(v.string()),
    model: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    sessionId: v.optional(v.string()),
    runAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Deduplicate: skip if same jobId + runAt already exists
    const existing = await ctx.db
      .query("cron_logs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId).eq("runAt", args.runAt))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("cron_logs", args);
  },
});

export const getLogs = query({
  args: { jobId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("cron_logs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .order("desc")
      .take(args.limit || 20);
    return logs;
  },
});

export const getRecentLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cron_logs")
      .withIndex("by_runAt")
      .order("desc")
      .take(args.limit || 50);
  },
});

export const getRecentLogsWithNames = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("cron_logs")
      .withIndex("by_runAt")
      .order("desc")
      .take(args.limit || 100);

    // Batch lookup cron names
    const cronCache = new Map<string, { name: string; agentId?: string }>();
    const enriched = [];
    for (const log of logs) {
      if (!cronCache.has(log.jobId)) {
        const cron = await ctx.db
          .query("crons")
          .withIndex("by_jobId", (q) => q.eq("jobId", log.jobId))
          .first();
        cronCache.set(log.jobId, {
          name: cron?.name || log.jobId.slice(0, 8),
          agentId: cron?.agentId,
        });
      }
      const info = cronCache.get(log.jobId)!;
      enriched.push({
        ...log,
        jobName: info.name,
        agentId: info.agentId,
      });
    }
    return enriched;
  },
});

// ── Stats ───────────────────────────────────────────────────────────

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("crons").collect();
    const enabled = all.filter((c) => c.enabled);
    const failed = all.filter((c) => c.lastStatus === "error" || c.lastStatus === "timeout");
    const healthy = enabled.filter((c) => c.lastStatus === "ok");
    const stale = enabled.filter((c) => {
      if (!c.lastRunAt) return true;
      const hoursSince = (Date.now() - c.lastRunAt) / 3600000;
      return hoursSince > 6;
    });

    return {
      total: all.length,
      enabled: enabled.length,
      disabled: all.length - enabled.length,
      healthy: healthy.length,
      failed: failed.length,
      stale: stale.length,
    };
  },
});
