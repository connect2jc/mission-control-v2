import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .collect();
  },
});

// Used by agents via API — requires agentId
export const add = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      taskId: args.taskId,
      agentId: args.agentId,
      message: args.message,
      createdAt: Date.now(),
    });

    const agent = await ctx.db.get(args.agentId);
    const task = await ctx.db.get(args.taskId);

    if (agent && task) {
      await ctx.db.insert("activities", {
        type: "comment",
        agentId: args.agentId,
        message: `${agent.emoji} ${agent.name} commented on "${task.title}": ${args.message.slice(0, 100)}`,
        createdAt: Date.now(),
      });
    }

    const mentions = args.message.match(/@(\w+)/g);
    if (mentions && agent) {
      const mentionedNames = mentions.map((m) => m.slice(1).toLowerCase());
      for (const name of mentionedNames) {
        const mentioned = await ctx.db
          .query("agents")
          .withIndex("by_name", (q) => q.eq("name", name))
          .first();
        if (mentioned) {
          await ctx.db.insert("notifications", {
            mentionedAgentId: mentioned._id,
            fromAgentId: args.agentId,
            content: `${agent.name} mentioned you on "${task?.title}": ${args.message.slice(0, 100)}`,
            taskId: args.taskId,
            delivered: false,
            createdAt: Date.now(),
          });
        }
      }
    }

    return commentId;
  },
});

// Used by dashboard owner — no agent impersonation
export const addAsOwner = mutation({
  args: {
    taskId: v.id("tasks"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      taskId: args.taskId,
      authorName: "JC",
      message: args.message,
      createdAt: Date.now(),
    });

    const task = await ctx.db.get(args.taskId);
    if (task) {
      await ctx.db.insert("activities", {
        type: "comment",
        message: `👤 JC commented on "${task.title}": ${args.message.slice(0, 100)}`,
        createdAt: Date.now(),
      });
    }

    return commentId;
  },
});
