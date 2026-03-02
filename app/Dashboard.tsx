"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import type { Id } from "../convex/_generated/dataModel";

type Tab = "overview" | "agents" | "tasks" | "content" | "products" | "activity" | "memories";
type Comment = { _id: string; taskId: string; agentId: string; message: string; createdAt: number };

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "agents", label: "Agents", icon: "🤖" },
  { id: "tasks", label: "Tasks", icon: "📋" },
  { id: "content", label: "Content", icon: "✍️" },
  { id: "products", label: "Products", icon: "🚀" },
  { id: "activity", label: "Activity", icon: "⚡" },
  { id: "memories", label: "Memories", icon: "🧠" },
];

// ─── Shared Components ──────────────────────────────────────────────

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

// ─── Sidebar ────────────────────────────────────────────────────────

function Sidebar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <aside className="hidden md:flex flex-col w-[200px] min-h-screen bg-[var(--bg-secondary)] border-r border-[var(--border)] fixed left-0 top-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[var(--border)]">
        <span className="text-xl">🛰️</span>
        <div>
          <div className="text-sm font-bold leading-tight">Mission Control</div>
          <div className="text-[10px] text-[var(--text-secondary)]">OpenClaw</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
              active === tab.id
                ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 border-l-2 border-[var(--accent-blue)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border-l-2 border-transparent"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom: Budget + Live */}
      <div className="border-t border-[var(--border)] p-4 space-y-3">
        <div>
          <div className="flex items-end gap-1.5">
            <span className="text-lg font-bold text-[var(--accent-green)]">$0</span>
            <span className="text-xs text-[var(--text-secondary)] pb-0.5">/ $100</span>
          </div>
          <div className="mt-1.5 w-full bg-[var(--bg-primary)] rounded-full h-1">
            <div className="bg-[var(--accent-green)] h-1 rounded-full" style={{ width: "0%" }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-[var(--text-secondary)]">Live</span>
        </div>
      </div>
    </aside>
  );
}

function MobileNav({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <div className="md:hidden flex items-center gap-1 overflow-x-auto px-2 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-10">
      <span className="text-lg mr-1">🛰️</span>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
            active === tab.id
              ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────────

function OverviewTab() {
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const activities = useQuery(api.activities.list, { limit: 5 });

  const working = agents?.filter((a) => a.status === "working").length ?? 0;
  const inProgress = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const totalTasks = tasks?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Agents Working", value: working, color: "var(--accent-green)" },
          { label: "Total Agents", value: agents?.length ?? 0, color: "var(--accent-blue)" },
          { label: "Tasks In Progress", value: inProgress, color: "var(--accent-yellow)" },
          { label: "Total Tasks", value: totalTasks, color: "var(--accent-purple)" },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Agent Grid (compact 2x5) */}
      {agents && (
        <div>
          <h2 className="text-sm font-semibold mb-2 text-[var(--text-secondary)] uppercase tracking-wide">Agents</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {agents.map((agent) => (
              <div key={agent._id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 hover:bg-[var(--bg-hover)] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{agent.emoji}</span>
                  <span className="font-medium text-sm capitalize">{agent.name}</span>
                  <StatusDot status={agent.status} />
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{agent.role}</div>
                {agent.currentTask && (
                  <div className="text-[10px] text-[var(--accent-yellow)] mt-0.5 truncate">{agent.currentTask}</div>
                )}
                {agent.lastHeartbeat && <div className="mt-1"><TimeAgo timestamp={agent.lastHeartbeat} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget + Crons side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BudgetWidget />
        <CronStatus />
      </div>

      {/* Recent Activity */}
      {activities && activities.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2 text-[var(--text-secondary)] uppercase tracking-wide">Recent Activity</h2>
          <div className="space-y-1">
            {activities.map((a) => (
              <div key={a._id} className="flex items-center gap-2 p-2 bg-[var(--bg-card)] border border-[var(--border)] rounded text-xs">
                <TimeAgo timestamp={a.createdAt} />
                <span className="text-[var(--text-secondary)] truncate">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agents Tab ─────────────────────────────────────────────────────

function AgentsTab() {
  const agents = useQuery(api.agents.list);
  const activities = useQuery(api.activities.list, { limit: 50 });
  const tasks = useQuery(api.tasks.list);

  if (!agents) return <div className="text-[var(--text-secondary)]">Loading agents...</div>;

  const actByAgent = new Map<string, typeof activities>();
  if (activities) {
    for (const a of activities) {
      if (!a.agentId) continue;
      const list = actByAgent.get(a.agentId) || [];
      if (list.length < 3) list.push(a);
      actByAgent.set(a.agentId, list);
    }
  }

  const taskByAgent = new Map<string, string>();
  if (tasks && agents) {
    const agentIdToName = new Map(agents.map((a) => [a._id, a.name]));
    for (const t of tasks) {
      if (t.status === "in_progress" && t.assigneeIds.length > 0) {
        for (const id of t.assigneeIds) {
          const name = agentIdToName.get(id);
          if (name) taskByAgent.set(name, t.title);
        }
      }
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Agents ({agents.length})</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {agents.map((agent) => {
          const recentActs = actByAgent.get(agent._id) || [];
          const currentTask = taskByAgent.get(agent.name);
          return (
            <div key={agent._id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{agent.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold capitalize">{agent.name}</span>
                    <StatusDot status={agent.status} />
                    <span className="text-xs text-[var(--text-secondary)]">{agent.status}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">{agent.role}</div>
                </div>
                {agent.lastHeartbeat && <TimeAgo timestamp={agent.lastHeartbeat} />}
              </div>
              <div className="text-xs space-y-1">
                <div className="flex gap-2">
                  <span className="text-[var(--text-secondary)] w-16">Model</span>
                  <span>{agent.model || "—"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[var(--text-secondary)] w-16">Channel</span>
                  <span>{agent.channel || "—"}</span>
                </div>
                {(agent.currentTask || currentTask) && (
                  <div className="flex gap-2">
                    <span className="text-[var(--text-secondary)] w-16">Task</span>
                    <span className="text-[var(--accent-yellow)]">{agent.currentTask || currentTask}</span>
                  </div>
                )}
              </div>
              {recentActs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1">
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase">Recent</div>
                  {recentActs.map((a) => (
                    <div key={a._id} className="text-xs text-[var(--text-secondary)] truncate">
                      <TimeAgo timestamp={a.createdAt} /> — {a.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Task Comments ──────────────────────────────────────────────────

function TaskComments({ taskId, agents }: { taskId: Id<"tasks">; agents: { _id: string; name: string; emoji: string }[] }) {
  const comments = useQuery(api.comments.getByTask, { taskId });
  const agentMap = new Map(agents.map((a) => [a._id, a]));

  if (!comments || comments.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-1.5">
      <div className="text-[10px] text-[var(--text-secondary)] uppercase">Comments ({comments.length})</div>
      {comments.map((c) => {
        const agent = agentMap.get(c.agentId);
        return (
          <div key={c._id} className="text-xs bg-[var(--bg-primary)] rounded px-2 py-1.5">
            <div className="flex items-center gap-1 mb-0.5">
              {agent && <span className="font-medium text-[var(--accent-blue)]">{agent.emoji} {agent.name}</span>}
              <TimeAgo timestamp={c.createdAt} />
            </div>
            <div className="text-[var(--text-secondary)]">{c.message}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tasks Tab ──────────────────────────────────────────────────────

function TaskBoard() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const [filter, setFilter] = useState<string>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  if (!tasks || !agents) return <div className="text-[var(--text-secondary)]">Loading tasks...</div>;

  const columns = ["todo", "in_progress", "review", "done", "blocked", "backlog"];
  const columnLabels: Record<string, string> = {
    todo: "To Do", in_progress: "In Progress", review: "Review",
    done: "Done", blocked: "Blocked", backlog: "Backlog",
  };
  const columnColors: Record<string, string> = {
    todo: "border-[var(--accent-blue)]", in_progress: "border-[var(--accent-yellow)]",
    review: "border-[var(--accent-purple)]", done: "border-[var(--accent-green)]",
    blocked: "border-[var(--accent-red)]", backlog: "border-gray-600",
  };
  const priorityBadge: Record<string, string> = {
    critical: "bg-red-500/20 text-red-300", high: "bg-orange-500/20 text-orange-300",
    medium: "bg-blue-500/20 text-blue-300", low: "bg-gray-500/20 text-gray-300",
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
                <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">{columnLabels[col]}</span>
                <span className="text-xs text-[var(--text-secondary)]">{colTasks.length}</span>
              </div>
              <div className="space-y-1.5">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded p-2 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    onClick={() => setExpandedTask(expandedTask === task._id ? null : task._id)}
                  >
                    <div className="text-xs font-medium mb-1">{task.title}</div>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${priorityBadge[task.priority]}`}>{task.priority}</span>
                      {task.category && <span className="text-[10px] text-[var(--text-secondary)]">{task.category}</span>}
                    </div>
                    {task.blocker && <div className="mt-1 text-[10px] text-red-300">Blocked: {task.blocker}</div>}
                    {expandedTask === task._id && (
                      <TaskComments taskId={task._id as Id<"tasks">} agents={agents} />
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

// ─── Content Tab ────────────────────────────────────────────────────

function ContentQueue() {
  const content = useQuery(api.content.list, { limit: 50 });
  const agents = useQuery(api.agents.list);
  const approve = useMutation(api.content.approve);
  const publish = useMutation(api.content.publish);
  const generateImageAction = useAction(api.content.generateImage);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!content || !agents) return <div className="text-[var(--text-secondary)]">Loading content...</div>;

  const agentMap = new Map(agents.map((a) => [a._id, a]));
  const statuses = ["all", "draft", "approved", "ready", "published"] as const;
  const filtered = filter === "all" ? content : content.filter((c) => c.status === filter);

  const counts: Record<string, number> = {};
  for (const s of statuses) {
    counts[s] = s === "all" ? content.length : content.filter((c) => c.status === s).length;
  }

  const statusStyle: Record<string, { color: string; bg: string }> = {
    draft: { color: "var(--accent-yellow)", bg: "rgba(255,170,34,0.12)" },
    approved: { color: "var(--accent-purple)", bg: "rgba(136,68,255,0.12)" },
    image_generating: { color: "var(--accent-blue)", bg: "rgba(68,102,255,0.12)" },
    ready: { color: "var(--accent-green)", bg: "rgba(34,204,136,0.12)" },
    published: { color: "var(--text-secondary)", bg: "rgba(136,136,170,0.08)" },
  };

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (id: Id<"content">) => { await approve({ id }); };
  const handleGenerateImage = async (id: Id<"content">, text: string, pillar?: string) => {
    try { await generateImageAction({ id, text, pillar }); } catch (e) { console.error("Image generation failed:", e); }
  };
  const handlePublish = async (id: Id<"content">) => { await publish({ id }); };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Content Queue</h2>
          {counts.draft > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: "var(--accent-yellow)", background: "rgba(255,170,34,0.12)" }}>
              {counts.draft} draft{counts.draft !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                filter === s ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]"
              }`}
            >
              {s === "all" ? `All (${counts.all})` : `${s} (${counts[s] || 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((item) => {
          const style = statusStyle[item.status] || statusStyle.draft;
          const agent = item.agentId ? agentMap.get(item.agentId) : null;
          const isExpanded = expandedId === item._id;

          return (
            <div key={item._id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden hover:bg-[var(--bg-hover)] transition-colors">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: style.color, background: style.bg }}>
                  {item.status === "image_generating" ? "generating..." : item.status}
                </span>
                <span className="text-sm flex-1 min-w-0 truncate">{item.text.split("\n")[0]}</span>
                {item.pillar && <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0">{item.pillar}</span>}
                {item.scheduledTime && <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0">{item.scheduledTime}</span>}
                {agent && <span className="text-xs flex-shrink-0">{agent.emoji}</span>}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  className={`flex-shrink-0 text-[var(--text-secondary)] transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[var(--border)]">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap py-3 text-[var(--text-secondary)]">{item.text}</div>
                  {item.imageUrl && !item.imageUrl.startsWith("error:") && (
                    <div className="mb-3 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--accent-green)] mb-1">Image generated</div>
                      <img src={item.imageUrl} alt="Generated image" className="w-full max-h-64 object-contain rounded-md mt-1" />
                    </div>
                  )}
                  {item.imageUrl?.startsWith("error:") && (
                    <div className="mb-3 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--accent-red)]">
                      <div className="text-[10px] text-[var(--accent-red)]">Generation failed — {item.imageUrl.slice(7).slice(0, 80)}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-1">Click &quot;Generate Image&quot; to retry</div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-secondary)]">{item.text.length} chars · {item.platform}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); copyText(item._id, item.text); }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors">
                        {copiedId === item._id ? "Copied" : "Copy"}
                      </button>
                      {item.status === "draft" && (
                        <button onClick={(e) => { e.stopPropagation(); handleApprove(item._id as Id<"content">); }}
                          className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors" style={{ background: "rgba(136,68,255,0.15)", color: "var(--accent-purple)" }}>
                          Approve
                        </button>
                      )}
                      {item.status === "approved" && (
                        <button onClick={(e) => { e.stopPropagation(); handleGenerateImage(item._id as Id<"content">, item.text, item.pillar); }}
                          className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors" style={{ background: "rgba(68,102,255,0.15)", color: "var(--accent-blue)" }}>
                          Generate Image
                        </button>
                      )}
                      {(item.status === "ready" || item.status === "approved") && (
                        <button onClick={(e) => { e.stopPropagation(); handlePublish(item._id as Id<"content">); }}
                          className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors" style={{ background: "rgba(34,204,136,0.15)", color: "var(--accent-green)" }}>
                          Mark Published
                        </button>
                      )}
                      {item.status === "image_generating" && (
                        <span className="text-xs text-[var(--accent-blue)] animate-pulse">Generating image...</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            <div className="text-sm">No content in this view</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Products Tab ───────────────────────────────────────────────────

function ProductsTab() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);

  if (!tasks || !agents) return <div className="text-[var(--text-secondary)]">Loading products...</div>;

  const products = tasks.filter(
    (t) => t.category === "product" || t.category === "coding" || t.category === "development"
  );

  const statusColors: Record<string, string> = {
    todo: "bg-blue-500/20 text-blue-300",
    in_progress: "bg-yellow-500/20 text-yellow-300",
    review: "bg-purple-500/20 text-purple-300",
    done: "bg-green-500/20 text-green-300",
    blocked: "bg-red-500/20 text-red-300",
    backlog: "bg-gray-500/20 text-gray-300",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Products & Coding Projects</h2>
        <span className="text-xs text-[var(--text-secondary)]">{products.length} projects</span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <div className="text-3xl mb-3">🚀</div>
          <div className="text-sm">No product/coding tasks yet</div>
          <div className="text-xs mt-1">Tasks with category &quot;product&quot;, &quot;coding&quot;, or &quot;development&quot; appear here</div>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((task) => (
            <div key={task._id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--bg-hover)] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold flex-1">{task.title}</span>
                <span className={`px-2 py-0.5 text-[10px] rounded-full ${statusColors[task.status]}`}>{task.status.replace("_", " ")}</span>
              </div>
              {task.description && (
                <div className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{task.description}</div>
              )}
              <div className="flex items-center gap-4 text-xs">
                {task.assigneeIds.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--text-secondary)]">Agent:</span>
                    {task.assigneeIds.map((id) => {
                      const a = agents.find((ag) => ag._id === id);
                      return a ? <span key={id} className="text-[var(--accent-blue)] capitalize">{a.emoji} {a.name}</span> : null;
                    })}
                  </div>
                )}
                {task.category && (
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--text-secondary)]">Category:</span>
                    <span>{task.category}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-[var(--text-secondary)]">Priority:</span>
                  <span>{task.priority}</span>
                </div>
              </div>
              {task.blocker && (
                <div className="mt-2 text-xs text-red-300 bg-red-500/10 rounded px-2 py-1">
                  Blocker: {task.blocker}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Activity Tab ───────────────────────────────────────────────────

function ActivityFeed() {
  const activities = useQuery(api.activities.list, { limit: 100 });
  const agents = useQuery(api.agents.list);
  if (!activities || !agents) return <div className="text-[var(--text-secondary)]">Loading...</div>;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const typeIcons: Record<string, string> = {
    task_created: "📋", task_updated: "✏️", task_completed: "✅",
    message_sent: "💬", agent_online: "🟢", agent_offline: "🔴",
    heartbeat: "💓", memory_saved: "🧠", standup: "☀️",
    consolidation: "🌙", custom: "⚡", comment: "💬",
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Activity Feed</h2>
      <div className="space-y-1">
        {activities.map((activity) => {
          const agent = activity.agentId ? agentMap.get(activity.agentId) : null;
          return (
            <div key={activity._id} className="flex items-start gap-2 p-2 bg-[var(--bg-card)] border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] transition-colors">
              <span className="text-sm">{typeIcons[activity.type] || "⚡"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {agent && <span className="text-xs font-medium text-[var(--accent-blue)] capitalize">{agent.emoji} {agent.name}</span>}
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

// ─── Memories Tab ───────────────────────────────────────────────────

function MemoriesTab() {
  const memories = useQuery(api.memories.listCritical, { limit: 50 });
  const agents = useQuery(api.agents.list);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  if (!memories || !agents) return <div className="text-[var(--text-secondary)]">Loading...</div>;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const categories = ["all", ...new Set(memories.map((m) => m.category))];
  const agentOptions = ["all", ...new Set(memories.map((m) => {
    const a = agentMap.get(m.agentId);
    return a?.name || "";
  }).filter(Boolean))];

  let filtered = memories;
  if (catFilter !== "all") filtered = filtered.filter((m) => m.category === catFilter);
  if (agentFilter !== "all") filtered = filtered.filter((m) => {
    const a = agentMap.get(m.agentId);
    return a?.name === agentFilter;
  });

  const categoryColors: Record<string, string> = {
    decision: "bg-purple-500/20 text-purple-300", lesson: "bg-yellow-500/20 text-yellow-300",
    preference: "bg-blue-500/20 text-blue-300", task_outcome: "bg-green-500/20 text-green-300",
    insight: "bg-cyan-500/20 text-cyan-300", conversation: "bg-gray-500/20 text-gray-300",
    other: "bg-gray-500/20 text-gray-300",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Memories ({filtered.length})</h2>
        <div className="flex gap-2">
          <select
            value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="text-xs bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)]"
          >
            {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
          </select>
          <select
            value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}
            className="text-xs bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)]"
          >
            {agentOptions.map((a) => <option key={a} value={a}>{a === "all" ? "All agents" : a}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-xs text-[var(--text-secondary)]">No memories match filters</div>
        )}
        {filtered.map((mem) => {
          const agent = agentMap.get(mem.agentId);
          return (
            <div key={mem._id} className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] transition-colors">
              <div className="flex items-center gap-1.5 mb-1.5">
                {agent && <span className="text-xs capitalize">{agent.emoji} {agent.name}</span>}
                <span className={`px-1.5 py-0.5 text-[10px] rounded ${categoryColors[mem.category] || categoryColors.other}`}>{mem.category}</span>
                {Number(mem.importance) >= 8 && <span className="text-[10px] text-red-300">important</span>}
                <span className="flex-1" />
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

// ─── Reused Widgets ─────────────────────────────────────────────────

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
              <span className={`w-1.5 h-1.5 rounded-full ${
                c.status === "ok" ? "bg-green-400" : c.status === "error" ? "bg-red-400" : "bg-blue-400"
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const panels: Record<Tab, React.ReactNode> = {
    overview: <OverviewTab />,
    agents: <AgentsTab />,
    tasks: <TaskBoard />,
    content: <ContentQueue />,
    products: <ProductsTab />,
    activity: <ActivityFeed />,
    memories: <MemoriesTab />,
  };

  return (
    <div className="min-h-screen">
      <Sidebar active={activeTab} onSelect={setActiveTab} />
      <MobileNav active={activeTab} onSelect={setActiveTab} />
      <main className="md:ml-[200px] p-6">
        {panels[activeTab]}
      </main>
    </div>
  );
}
