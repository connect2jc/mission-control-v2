"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: "bg-gray-400",
    working: "bg-green-400 animate-pulse",
    offline: "bg-gray-600",
    error: "bg-red-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || "bg-gray-400"}`} />;
}

function TimeAgo({ timestamp }: { timestamp: number }) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return <span className="text-[var(--text-secondary)] text-xs">just now</span>;
  if (mins < 60) return <span className="text-[var(--text-secondary)] text-xs">{mins}m ago</span>;
  if (hrs < 24) return <span className="text-[var(--text-secondary)] text-xs">{hrs}h ago</span>;
  return <span className="text-[var(--text-secondary)] text-xs">{days}d ago</span>;
}

function AgentCards() {
  const agents = useQuery(api.agents.list);
  if (!agents) return <div className="text-[var(--text-secondary)]">Loading agents...</div>;

  const working = agents.filter((a) => a.status === "working").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Agents</h2>
        <span className="text-xs text-[var(--text-secondary)]">
          {working} working / {agents.length} total
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {agents.map((agent) => (
          <div
            key={agent._id}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{agent.emoji}</span>
              <span className="font-medium text-sm capitalize">{agent.name}</span>
              <StatusDot status={agent.status} />
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{agent.role}</div>
            {agent.lastHeartbeat && (
              <div className="mt-1">
                <TimeAgo timestamp={agent.lastHeartbeat} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskBoard() {
  const tasks = useQuery(api.tasks.list);
  const [filter, setFilter] = useState<string>("all");
  if (!tasks) return <div className="text-[var(--text-secondary)]">Loading tasks...</div>;

  const columns = ["todo", "in_progress", "review", "done", "blocked", "backlog"];
  const columnLabels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "Review",
    done: "Done",
    blocked: "Blocked",
    backlog: "Backlog",
  };
  const columnColors: Record<string, string> = {
    todo: "border-[var(--accent-blue)]",
    in_progress: "border-[var(--accent-yellow)]",
    review: "border-[var(--accent-purple)]",
    done: "border-[var(--accent-green)]",
    blocked: "border-[var(--accent-red)]",
    backlog: "border-gray-600",
  };

  const priorityBadge: Record<string, string> = {
    critical: "bg-red-500/20 text-red-300",
    high: "bg-orange-500/20 text-orange-300",
    medium: "bg-blue-500/20 text-blue-300",
    low: "bg-gray-500/20 text-gray-300",
  };

  const categories = ["all", ...new Set(tasks.map((t) => t.category).filter(Boolean))];
  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.category === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Task Board</h2>
        <div className="flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as string)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                filter === cat
                  ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {columns.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col);
          return (
            <div key={col} className={`border-t-2 ${columnColors[col]} pt-2`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                  {columnLabels[col]}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">{colTasks.length}</span>
              </div>
              <div className="space-y-1.5">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded p-2 hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="text-xs font-medium mb-1">{task.title}</div>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${priorityBadge[task.priority]}`}>
                        {task.priority}
                      </span>
                      {task.category && (
                        <span className="text-[10px] text-[var(--text-secondary)]">{task.category}</span>
                      )}
                    </div>
                    {task.blocker && (
                      <div className="mt-1 text-[10px] text-red-300">Blocked: {task.blocker}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityFeed() {
  const activities = useQuery(api.activities.list, { limit: 30 });
  const agents = useQuery(api.agents.list);
  if (!activities || !agents) return <div className="text-[var(--text-secondary)]">Loading...</div>;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const typeIcons: Record<string, string> = {
    task_created: "📋",
    task_updated: "✏️",
    task_completed: "✅",
    message_sent: "💬",
    agent_online: "🟢",
    agent_offline: "🔴",
    heartbeat: "💓",
    memory_saved: "🧠",
    standup: "☀️",
    consolidation: "🌙",
    custom: "⚡",
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Activity Feed</h2>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {activities.map((activity) => {
          const agent = activity.agentId ? agentMap.get(activity.agentId) : null;
          return (
            <div
              key={activity._id}
              className="flex items-start gap-2 p-2 bg-[var(--bg-card)] border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="text-sm">{typeIcons[activity.type] || "⚡"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {agent && (
                    <span className="text-xs font-medium text-[var(--accent-blue)] capitalize">
                      {agent.emoji} {agent.name}
                    </span>
                  )}
                  <TimeAgo timestamp={activity.createdAt} />
                </div>
                <div className="text-xs text-[var(--text-secondary)] truncate">{activity.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemoryBrowser() {
  const memories = useQuery(api.memories.listCritical, { limit: 20 });
  const agents = useQuery(api.agents.list);
  if (!memories || !agents) return <div className="text-[var(--text-secondary)]">Loading...</div>;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const categoryColors: Record<string, string> = {
    decision: "bg-purple-500/20 text-purple-300",
    lesson: "bg-yellow-500/20 text-yellow-300",
    preference: "bg-blue-500/20 text-blue-300",
    task_outcome: "bg-green-500/20 text-green-300",
    insight: "bg-cyan-500/20 text-cyan-300",
    conversation: "bg-gray-500/20 text-gray-300",
    other: "bg-gray-500/20 text-gray-300",
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Critical Memories</h2>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {memories.length === 0 && (
          <div className="text-xs text-[var(--text-secondary)] p-2">No critical memories yet</div>
        )}
        {memories.map((mem) => {
          const agent = agentMap.get(mem.agentId);
          return (
            <div
              key={mem._id}
              className="p-2 bg-[var(--bg-card)] border border-[var(--border)] rounded"
            >
              <div className="flex items-center gap-1.5 mb-1">
                {agent && <span className="text-xs capitalize">{agent.emoji} {agent.name}</span>}
                <span className={`px-1.5 py-0.5 text-[10px] rounded ${categoryColors[mem.category]}`}>
                  {mem.category}
                </span>
                <TimeAgo timestamp={mem.createdAt} />
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{mem.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BudgetWidget() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-2">Budget</h3>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-[var(--accent-green)]">$0</span>
        <span className="text-sm text-[var(--text-secondary)]">/ $100</span>
      </div>
      <div className="mt-2 w-full bg-[var(--bg-primary)] rounded-full h-1.5">
        <div className="bg-[var(--accent-green)] h-1.5 rounded-full" style={{ width: "0%" }} />
      </div>
      <div className="mt-1 text-[10px] text-[var(--text-secondary)]">$100 remaining</div>
    </div>
  );
}

function CronStatus() {
  const crons = [
    { name: "Security Audit", schedule: "9:00 AM", agent: "Marvis", status: "ok" },
    { name: "Research Brief", schedule: "8:00 AM", agent: "Rex", status: "error" },
    { name: "ASO Audit", schedule: "Mon 9 AM", agent: "Aria", status: "ok" },
    { name: "Pipeline Review", schedule: "Mon 9 AM", agent: "Nexus", status: "ok" },
    { name: "Dashboard Deploy", schedule: "Every 30m", agent: "Marvis", status: "ok" },
    { name: "Nightly Consolidation", schedule: "2:00 AM", agent: "Marvis", status: "new" },
    { name: "Morning Standup", schedule: "7:30 AM", agent: "Marvis", status: "new" },
  ];
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-2">Cron Jobs</h3>
      <div className="space-y-1">
        {crons.map((c) => (
          <div key={c.name} className="flex items-center justify-between text-xs">
            <span>{c.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">{c.schedule}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  c.status === "ok" ? "bg-green-400" : c.status === "error" ? "bg-red-400" : "bg-blue-400"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen p-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛰️</span>
          <div>
            <h1 className="text-xl font-bold">Mission Control</h1>
            <p className="text-xs text-[var(--text-secondary)]">OpenClaw Agent Orchestration — Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-[var(--text-secondary)]">Live</span>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="mb-6">
        <AgentCards />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Task Board - 3 cols */}
        <div className="lg:col-span-3">
          <TaskBoard />
        </div>
        {/* Sidebar - 1 col */}
        <div className="space-y-4">
          <BudgetWidget />
          <CronStatus />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed />
        <MemoryBrowser />
      </div>
    </div>
  );
}
