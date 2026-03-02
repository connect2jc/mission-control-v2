import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    emoji: v.string(),
    status: v.union(v.literal("idle"), v.literal("working"), v.literal("offline"), v.literal("error")),
    currentTaskId: v.optional(v.id("tasks")),
    sessionKey: v.optional(v.string()),
    lastHeartbeat: v.optional(v.number()),
    model: v.optional(v.string()),
    channel: v.optional(v.string()),
    currentTask: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_status", ["status"]),

  comments: defineTable({
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId", "createdAt"])
    .index("by_agent", ["agentId", "createdAt"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    priority: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    assigneeIds: v.array(v.id("agents")),
    category: v.optional(v.string()),
    blocker: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_category", ["category"]),

  messages: defineTable({
    taskId: v.optional(v.id("tasks")),
    fromAgentId: v.id("agents"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId", "createdAt"])
    .index("by_agent", ["fromAgentId", "createdAt"]),

  activities: defineTable({
    type: v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("message_sent"),
      v.literal("agent_online"),
      v.literal("agent_offline"),
      v.literal("heartbeat"),
      v.literal("memory_saved"),
      v.literal("standup"),
      v.literal("consolidation"),
      v.literal("custom"),
      v.literal("comment")
    ),
    agentId: v.optional(v.id("agents")),
    message: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_type", ["type", "createdAt"])
    .index("by_agent", ["agentId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(v.literal("prd"), v.literal("report"), v.literal("plan"), v.literal("note"), v.literal("other")),
    taskId: v.optional(v.id("tasks")),
    agentId: v.optional(v.id("agents")),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_task", ["taskId"]),

  notifications: defineTable({
    mentionedAgentId: v.id("agents"),
    fromAgentId: v.id("agents"),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    delivered: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_mentioned", ["mentionedAgentId", "delivered"])
    .index("by_createdAt", ["createdAt"]),

  content: defineTable({
    text: v.string(),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("all")),
    pillar: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("image_generating"),
      v.literal("ready"),
      v.literal("published")
    ),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    agentId: v.optional(v.id("agents")),
    approvedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_platform", ["platform", "createdAt"]),

  memories: defineTable({
    agentId: v.id("agents"),
    content: v.string(),
    category: v.union(
      v.literal("decision"),
      v.literal("lesson"),
      v.literal("preference"),
      v.literal("task_outcome"),
      v.literal("insight"),
      v.literal("conversation"),
      v.literal("other")
    ),
    sessionId: v.optional(v.string()),
    importance: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentId", "createdAt"])
    .index("by_category", ["category", "createdAt"])
    .index("by_importance", ["importance", "createdAt"]),
});
