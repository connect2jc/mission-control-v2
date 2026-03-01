import { mutation } from "./_generated/server";

export const seedAgents = mutation({
  handler: async (ctx) => {
    const agents = [
      { name: "marvis", role: "Orchestrator", emoji: "🧠", status: "idle" as const, model: "claude-sonnet-4-6", channel: "#marvis" },
      { name: "sable", role: "Sales Agent", emoji: "💼", status: "idle" as const, model: "claude-sonnet-4-6", channel: "#sales-agent" },
      { name: "maya", role: "Marketing Agent", emoji: "📣", status: "idle" as const, model: "claude-sonnet-4-6", channel: "#marketing-agent" },
      { name: "rex", role: "Research Agent", emoji: "🔍", status: "idle" as const, model: "claude-sonnet-4-6", channel: "#research-agent" },
      { name: "aria", role: "ASO Agent", emoji: "📱", status: "idle" as const, model: "claude-sonnet-4-6", channel: "#aso-agent" },
      { name: "vault", role: "Finance Guardian", emoji: "🔐", status: "idle" as const, model: "claude-sonnet-4-6", channel: "#finance-guardian" },
      { name: "nexus", role: "Mission Control", emoji: "🛰️", status: "idle" as const, model: "claude-sonnet-4-6", channel: "#mission-control" },
      { name: "vera", role: "QC Reviewer", emoji: "✅", status: "idle" as const, model: "claude-sonnet-4-6", channel: "#qc-review" },
      { name: "flint", role: "Twitter Agent", emoji: "🔥", status: "offline" as const, model: "claude-sonnet-4-6", channel: "#twitter-agent" },
      { name: "archer", role: "LinkedIn Agent", emoji: "🏹", status: "offline" as const, model: "claude-sonnet-4-6", channel: "#linkedin-agent" },
    ];

    const agentIds: Record<string, any> = {};
    for (const agent of agents) {
      const id = await ctx.db.insert("agents", { ...agent, lastHeartbeat: Date.now() });
      agentIds[agent.name] = id;
    }

    // Seed tasks from TASKS.md active priorities
    const tasks = [
      { title: "Ship Projects → Sell Immediately", status: "todo" as const, priority: "critical" as const, category: "Active Priorities", assignee: "marvis" },
      { title: "Team Training on OpenClaw", status: "todo" as const, priority: "high" as const, category: "Active Priorities", assignee: "marvis" },
      { title: "Clear Execution Plan (Alpesh)", status: "todo" as const, priority: "high" as const, category: "Active Priorities", assignee: "marvis" },
      { title: "Mission Control Dashboard v2", status: "in_progress" as const, priority: "high" as const, category: "Strategic Roadmap", assignee: "nexus" },
      { title: "Construction OS", status: "backlog" as const, priority: "medium" as const, category: "Strategic Roadmap", assignee: "marvis" },
      { title: "Proposal Generator Agent", status: "backlog" as const, priority: "medium" as const, category: "Strategic Roadmap", assignee: "marvis" },
      { title: "Sales Closer Agent", status: "backlog" as const, priority: "medium" as const, category: "Strategic Roadmap", assignee: "sable" },
      { title: "YouTube Podcast — AI Agenting", status: "backlog" as const, priority: "medium" as const, category: "Strategic Roadmap", assignee: "marvis" },
      { title: "Agentic AI Platform GTM", status: "backlog" as const, priority: "medium" as const, category: "Strategic Roadmap", assignee: "maya" },
      { title: "GTM Strategy", status: "backlog" as const, priority: "medium" as const, category: "Strategic Roadmap", assignee: "maya" },
      { title: "Twitter Agent Setup", status: "blocked" as const, priority: "high" as const, category: "Foundation", assignee: "flint", blocker: "Need Twitter API creds from JC" },
      { title: "Copywriter Agent", status: "blocked" as const, priority: "medium" as const, category: "Foundation", assignee: "marvis", blocker: "Need JC writing samples" },
      { title: "PARA Knowledge Structure", status: "done" as const, priority: "high" as const, category: "Infrastructure", assignee: "marvis" },
      { title: "Nightly Consolidation Cron", status: "done" as const, priority: "high" as const, category: "Infrastructure", assignee: "marvis" },
      { title: "Agent Memory Seeding", status: "done" as const, priority: "high" as const, category: "Infrastructure", assignee: "marvis" },
    ];

    const now = Date.now();
    for (const task of tasks) {
      const { assignee, ...rest } = task;
      await ctx.db.insert("tasks", {
        ...rest,
        assigneeIds: [agentIds[assignee]],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Seed initial activities
    await ctx.db.insert("activities", {
      type: "custom",
      agentId: agentIds.marvis,
      message: "System initialized — PARA knowledge structure created, 10 agents seeded, nightly consolidation + morning standup crons active",
      createdAt: now,
    });

    await ctx.db.insert("activities", {
      type: "custom",
      agentId: agentIds.marvis,
      message: "Mission Control v2 (Convex) deployed — real-time dashboard ready",
      createdAt: now + 1,
    });

    return { agentCount: agents.length, taskCount: tasks.length };
  },
});
