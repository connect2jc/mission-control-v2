"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import type { Id } from "../convex/_generated/dataModel";

type Tab = "overview" | "agents" | "tasks" | "chat" | "content" | "twitter" | "products" | "activity" | "memories";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "agents", label: "Agents", icon: "🤖" },
  { id: "tasks", label: "Tasks", icon: "📋" },
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "content", label: "Content", icon: "✍️" },
  { id: "twitter", label: "Twitter", icon: "🐦" },
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

function HighlightMentions({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="text-[var(--accent-blue)] font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Theme Toggle ───────────────────────────────────────────────────

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = document.documentElement.getAttribute("data-theme") as "light" | "dark";
    setTheme(saved || "light");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("mc-theme", next);
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className="text-lg">{theme === "light" ? "🌙" : "☀️"}</span>
    </button>
  );
}

// ─── Notification Bell ──────────────────────────────────────────────

function NotificationBell() {
  const notifications = useQuery(api.notifications.listRecent, { limit: 20 });
  const agents = useQuery(api.agents.list);
  const [open, setOpen] = useState(false);

  const agentMap = new Map(agents?.map((a) => [a._id, a]) ?? []);
  const unreadCount = notifications?.filter((n) => !n.delivered).length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl z-40">
            <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] text-[var(--accent-blue)]">{unreadCount} unread</span>
              )}
            </div>
            {(!notifications || notifications.length === 0) ? (
              <div className="p-4 text-center text-xs text-[var(--text-secondary)]">No notifications yet</div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {notifications.map((n) => {
                  const from = agentMap.get(n.fromAgentId);
                  return (
                    <div
                      key={n._id}
                      className={`p-3 text-xs hover:bg-[var(--bg-hover)] transition-colors ${!n.delivered ? "bg-[var(--accent-blue)]/5" : ""}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {from && <span className="font-medium text-[var(--accent-blue)]">{from.emoji} {from.name}</span>}
                        <TimeAgo timestamp={n.createdAt} />
                        {!n.delivered && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />}
                      </div>
                      <div className="text-[var(--text-secondary)]"><HighlightMentions text={n.content} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────

function Sidebar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <aside className="hidden md:flex flex-col w-[200px] min-h-screen bg-[var(--bg-secondary)] border-r border-[var(--border)] fixed left-0 top-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[var(--border)]">
        <span className="text-xl">🛰️</span>
        <div className="flex-1">
          <div className="text-sm font-bold leading-tight">Mission Control</div>
          <div className="text-[10px] text-[var(--text-secondary)]">OpenClaw</div>
        </div>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <NotificationBell />
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
    <div className="md:hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛰️</span>
          <span className="text-sm font-bold">Mission Control</span>
        </div>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-10">
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
    </div>
  );
}

// ─── Task Detail Modal ──────────────────────────────────────────────

function TaskDetailModal({
  task,
  agents,
  onClose,
}: {
  task: {
    _id: Id<"tasks">;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigneeIds: Id<"agents">[];
    category?: string;
    blocker?: string;
    dueDate?: string;
    createdAt: number;
    updatedAt: number;
  };
  agents: { _id: Id<"agents">; name: string; emoji: string; role: string }[];
  onClose: () => void;
}) {
  const comments = useQuery(api.comments.getByTask, { taskId: task._id });
  const addComment = useMutation(api.comments.addAsOwner);
  const updateTask = useMutation(api.tasks.update);
  const [newComment, setNewComment] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments?.length]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment({
      taskId: task._id,
      message: newComment.trim(),
    });
    setNewComment("");
  };

  const handleAssign = async (agentId: Id<"agents">) => {
    const current = task.assigneeIds;
    const isAssigned = current.includes(agentId);
    const newIds = isAssigned
      ? current.filter((id) => id !== agentId)
      : [...current, agentId];
    await updateTask({ id: task._id, assigneeIds: newIds });
  };

  const statusColors: Record<string, string> = {
    todo: "bg-blue-500/15 text-blue-600",
    in_progress: "bg-yellow-500/15 text-yellow-700",
    review: "bg-purple-500/15 text-purple-600",
    done: "bg-green-500/15 text-green-600",
    blocked: "bg-red-500/15 text-red-600",
    backlog: "bg-gray-500/15 text-gray-600",
  };

  const priorityColors: Record<string, string> = {
    critical: "bg-red-500/15 text-red-600",
    high: "bg-orange-500/15 text-orange-600",
    medium: "bg-blue-500/15 text-blue-600",
    low: "bg-gray-500/15 text-gray-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-semibold mb-2">{task.title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] rounded-full ${statusColors[task.status]}`}>
                {task.status.replace("_", " ")}
              </span>
              <span className={`px-2 py-0.5 text-[10px] rounded-full ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              {task.category && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)]">
                  {task.category}
                </span>
              )}
              {task.dueDate && (
                <span className="text-[10px] text-[var(--text-secondary)]">Due: {task.dueDate}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Description</h3>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Blocker */}
          {task.blocker && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="text-xs font-semibold text-[var(--accent-red)] mb-0.5">Blocker</div>
              <div className="text-sm text-[var(--accent-red)]/80">{task.blocker}</div>
            </div>
          )}

          {/* Assignees */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Assigned Agents</h3>
              <button
                onClick={() => setShowAssign(!showAssign)}
                className="text-[10px] text-[var(--accent-blue)] hover:underline"
              >
                {showAssign ? "Done" : "Edit"}
              </button>
            </div>
            {task.assigneeIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.assigneeIds.map((id) => {
                  const agent = agentMap.get(id);
                  if (!agent) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-full text-xs">
                      {agent.emoji} {agent.name}
                      {showAssign && (
                        <button onClick={() => handleAssign(id)} className="ml-0.5 hover:text-[var(--accent-red)]">x</button>
                      )}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-[var(--text-secondary)]">No agents assigned</div>
            )}
            {showAssign && (
              <div className="mt-2 flex flex-wrap gap-1">
                {agents
                  .filter((a) => !task.assigneeIds.includes(a._id))
                  .map((a) => (
                    <button
                      key={a._id}
                      onClick={() => handleAssign(a._id)}
                      className="px-2 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded-full hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors"
                    >
                      {a.emoji} {a.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">
              Comments {comments && comments.length > 0 && `(${comments.length})`}
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(!comments || comments.length === 0) ? (
                <div className="text-xs text-[var(--text-secondary)] py-3 text-center">No comments yet</div>
              ) : (
                comments.map((c) => {
                  const agent = c.agentId ? agentMap.get(c.agentId) : null;
                  const displayName = agent ? `${agent.emoji} ${agent.name}` : (c.authorName ? `👤 ${c.authorName}` : "Unknown");
                  return (
                    <div key={c._id} className="bg-[var(--bg-primary)] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium text-[var(--accent-blue)]">
                          {displayName}
                        </span>
                        <TimeAgo timestamp={c.createdAt} />
                      </div>
                      <div className="text-sm text-[var(--text-primary)]">
                        <HighlightMentions text={c.message} />
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>
        </div>

        {/* Add Comment */}
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-[var(--text-secondary)]">Commenting as</span>
            <span className="text-xs font-medium text-[var(--accent-blue)]">👤 JC</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Add a comment... (use @name to mention)"
              className="flex-1 text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 text-sm font-medium bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
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
                  <div className="text-[10px] text-[var(--accent-yellow)] mt-0.5 truncate" title={agent.currentTask}>
                    ⚙️ {agent.currentTask}
                  </div>
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
                    <span className="text-[var(--accent-yellow)]">⚙️ {agent.currentTask || currentTask}</span>
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

// ─── Tasks Tab ──────────────────────────────────────────────────────

function TaskBoard() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const [filter, setFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  if (!tasks || !agents) return <div className="text-[var(--text-secondary)]">Loading tasks...</div>;

  const columns = ["backlog", "todo", "in_progress", "done", "blocked"] as const;
  const columnLabels: Record<string, string> = {
    backlog: "Backlog", todo: "To Do", in_progress: "In Progress",
    done: "Done", blocked: "Blocked",
  };
  const columnColors: Record<string, string> = {
    backlog: "border-[var(--text-secondary)]", todo: "border-[var(--accent-blue)]",
    in_progress: "border-[var(--accent-yellow)]", done: "border-[var(--accent-green)]",
    blocked: "border-[var(--accent-red)]",
  };
  const columnBadgeColors: Record<string, string> = {
    backlog: "bg-gray-500/15 text-[var(--text-secondary)]",
    todo: "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]",
    in_progress: "bg-[var(--accent-yellow)]/15 text-[var(--accent-yellow)]",
    done: "bg-[var(--accent-green)]/15 text-[var(--accent-green)]",
    blocked: "bg-[var(--accent-red)]/15 text-[var(--accent-red)]",
  };
  const priorityBadge: Record<string, string> = {
    critical: "bg-red-500/15 text-red-600", high: "bg-orange-500/15 text-orange-600",
    medium: "bg-blue-500/15 text-blue-600", low: "bg-gray-500/15 text-gray-600",
  };

  const categories = ["all", ...new Set(tasks.map((t) => t.category).filter(Boolean))];
  // Map "review" status tasks into "in_progress" column for display
  const normalizedTasks = tasks.map((t) => t.status === "review" ? { ...t, status: "in_progress" as const } : t);
  const filtered = filter === "all" ? normalizedTasks : normalizedTasks.filter((t) => t.category === filter);

  const openTask = selectedTask ? tasks.find((t) => t._id === selectedTask) : null;

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {columns.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col);
          return (
            <div key={col} className={`border-t-2 ${columnColors[col]} pt-2`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">{columnLabels[col]}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${columnBadgeColors[col]}`}>
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded p-2 hover:bg-[var(--bg-hover)] hover:border-[var(--accent-blue)]/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTask(task._id)}
                  >
                    <div className="text-xs font-medium mb-1 group-hover:text-[var(--accent-blue)] transition-colors">{task.title}</div>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${priorityBadge[task.priority]}`}>{task.priority}</span>
                      {task.category && <span className="text-[10px] text-[var(--text-secondary)]">{task.category}</span>}
                    </div>
                    {task.assigneeIds.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {task.assigneeIds.map((id) => {
                          const a = agents.find((ag) => ag._id === id);
                          return a ? <span key={id} className="text-xs" title={a.name}>{a.emoji}</span> : null;
                        })}
                      </div>
                    )}
                    {task.blocker && <div className="mt-1 text-[10px] text-[var(--accent-red)]">Blocked: {task.blocker}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {openTask && (
        <TaskDetailModal
          task={openTask as any}
          agents={agents as any}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

// ─── Chat Tab ───────────────────────────────────────────────────────

function ChatTab() {
  const messages = useQuery(api.messages.listRecent, { limit: 100 });
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const createMessage = useMutation(api.messages.createAsOwner);
  const [newMsg, setNewMsg] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agentMap = new Map(agents?.map((a) => [a._id, a]) ?? []);
  const taskMap = new Map(tasks?.map((t) => [t._id, t]) ?? []);

  // Messages come in desc order from API, reverse for display
  const sorted = messages ? [...messages].reverse() : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    await createMessage({
      content: newMsg.trim(),
      ...(selectedTask ? { taskId: selectedTask as Id<"tasks"> } : {}),
    });
    setNewMsg("");
  };

  if (!agents) return <div className="text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Agent Chat</h2>
        <span className="text-xs text-[var(--text-secondary)]">{sorted.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <div className="text-3xl mb-3">💬</div>
            <div className="text-sm">No messages yet</div>
            <div className="text-xs mt-1">Agent messages will appear here in real-time</div>
          </div>
        ) : (
          sorted.map((msg) => {
            const agent = msg.fromAgentId ? agentMap.get(msg.fromAgentId) : null;
            const task = msg.taskId ? taskMap.get(msg.taskId) : null;
            const displayName = agent ? agent.name : (msg.authorName ?? "unknown");
            const displayEmoji = agent ? agent.emoji : "👤";
            return (
              <div key={msg._id} className="flex gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                <span className="text-xl flex-shrink-0 mt-0.5">{displayEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-[var(--accent-blue)] capitalize">{displayName}</span>
                    <TimeAgo timestamp={msg.createdAt} />
                    {task && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-[var(--text-secondary)] truncate max-w-[150px]">
                        re: {task.title}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--text-primary)]">
                    <HighlightMentions text={msg.content} />
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-[var(--text-secondary)]">Sending as</span>
          <span className="text-xs font-medium text-[var(--accent-blue)]">👤 JC</span>
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] max-w-[200px]"
          >
            <option value="">No task link</option>
            {tasks?.map((t) => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message... (use @name to mention)"
            className="flex-1 text-sm bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
          <button
            onClick={handleSend}
            disabled={!newMsg.trim()}
            className="px-4 py-2 text-sm font-medium bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
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
    todo: "bg-blue-500/15 text-blue-600",
    in_progress: "bg-yellow-500/15 text-yellow-700",
    review: "bg-purple-500/15 text-purple-600",
    done: "bg-green-500/15 text-green-600",
    blocked: "bg-red-500/15 text-red-600",
    backlog: "bg-gray-500/15 text-gray-600",
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
                <div className="mt-2 text-xs text-[var(--accent-red)] bg-red-500/10 rounded px-2 py-1">
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
    decision: "bg-purple-500/15 text-purple-600", lesson: "bg-yellow-500/15 text-yellow-700",
    preference: "bg-blue-500/15 text-blue-600", task_outcome: "bg-green-500/15 text-green-600",
    insight: "bg-cyan-500/15 text-cyan-600", conversation: "bg-gray-500/15 text-gray-600",
    other: "bg-gray-500/15 text-gray-600",
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
                {Number(mem.importance) >= 8 && <span className="text-[10px] text-[var(--accent-red)]">important</span>}
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

// ─── Twitter Training Tab ────────────────────────────────────────────

type FeedbackCategory = "tone" | "content" | "structure" | "general";

function TwitterTrainingTab() {
  const drafts = useQuery(api.twitterTraining.listDrafts, {});
  const feedback = useQuery(api.twitterTraining.getAllFeedback, {});
  const stats = useQuery(api.twitterTraining.getStats);
  const createDraft = useMutation(api.twitterTraining.createDraft);
  const updateContent = useMutation(api.twitterTraining.updateDraftContent);
  const approveDraft = useMutation(api.twitterTraining.approveDraft);
  const rejectDraft = useMutation(api.twitterTraining.rejectDraft);
  const submitFeedback = useMutation(api.twitterTraining.submitFeedback);
  const deleteDraft = useMutation(api.twitterTraining.deleteDraft);

  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"review" | "history" | "stats">("review");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [feedbackCategory, setFeedbackCategory] = useState<Record<string, FeedbackCategory>>({});
  const [newDraftText, setNewDraftText] = useState("");
  const [showNewDraft, setShowNewDraft] = useState(false);

  if (!drafts || !feedback || !stats) {
    return <div className="text-[var(--text-secondary)]">Loading Twitter training...</div>;
  }

  const statuses = ["all", "draft", "approved", "rejected", "posted"] as const;
  const filtered = filter === "all" ? drafts : drafts.filter((d) => d.status === filter);

  const counts: Record<string, number> = {};
  for (const s of statuses) {
    counts[s] = s === "all" ? drafts.length : drafts.filter((d) => d.status === s).length;
  }

  const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
    draft: { color: "var(--accent-yellow)", bg: "rgba(255,170,34,0.12)", label: "Draft" },
    approved: { color: "var(--accent-green)", bg: "rgba(34,204,136,0.12)", label: "Approved" },
    rejected: { color: "var(--accent-red)", bg: "rgba(255,68,102,0.12)", label: "Rejected" },
    posted: { color: "var(--text-secondary)", bg: "rgba(136,136,170,0.08)", label: "Posted" },
  };

  const categoryColors: Record<string, { color: string; bg: string }> = {
    tone: { color: "var(--accent-purple)", bg: "rgba(136,68,255,0.12)" },
    content: { color: "var(--accent-blue)", bg: "rgba(68,102,255,0.12)" },
    structure: { color: "var(--accent-yellow)", bg: "rgba(255,170,34,0.12)" },
    general: { color: "var(--text-secondary)", bg: "rgba(136,136,170,0.08)" },
  };

  const handleApprove = async (id: Id<"twitter_drafts">, fb: string, cat: FeedbackCategory) => {
    if (fb.trim()) {
      await submitFeedback({ draftId: id, feedback: fb.trim(), category: cat });
    }
    await approveDraft({ id });
    setFeedbackText((prev) => ({ ...prev, [id]: "" }));
  };

  const handleReject = async (id: Id<"twitter_drafts">, fb: string, cat: FeedbackCategory) => {
    if (fb.trim()) {
      await submitFeedback({ draftId: id, feedback: fb.trim(), category: cat });
    }
    await rejectDraft({ id });
    setFeedbackText((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSubmitFeedbackOnly = async (draftId: Id<"twitter_drafts">, fb: string, cat: FeedbackCategory) => {
    if (!fb.trim()) return;
    await submitFeedback({ draftId, feedback: fb.trim(), category: cat });
    setFeedbackText((prev) => ({ ...prev, [draftId]: "" }));
  };

  const handleSaveEdit = async (id: Id<"twitter_drafts">) => {
    if (editText.trim()) {
      await updateContent({ id, content: editText.trim() });
    }
    setEditingId(null);
  };

  const handleCreateDraft = async () => {
    if (!newDraftText.trim()) return;
    await createDraft({ content: newDraftText.trim() });
    setNewDraftText("");
    setShowNewDraft(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Twitter Training</h2>
          {counts.draft > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: "var(--accent-yellow)", background: "rgba(255,170,34,0.12)" }}>
              {counts.draft} to review
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(["review", "history", "stats"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                view === v ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]"
              }`}
            >
              {v === "review" ? "Review" : v === "history" ? "History" : "Stats"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Review View ── */}
      {view === "review" && (
        <div>
          {/* Filter bar */}
          <div className="flex items-center justify-between mb-3">
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
            <button onClick={() => setShowNewDraft(!showNewDraft)}
              className="px-3 py-1 text-xs rounded-lg font-medium transition-colors"
              style={{ background: "rgba(68,102,255,0.15)", color: "var(--accent-blue)" }}
            >
              + New Draft
            </button>
          </div>

          {/* New draft input */}
          {showNewDraft && (
            <div className="bg-[var(--bg-card)] border border-[var(--accent-blue)] rounded-lg p-4 mb-3">
              <textarea
                value={newDraftText}
                onChange={(e) => setNewDraftText(e.target.value)}
                placeholder="Write a draft tweet..."
                className="w-full bg-transparent text-sm resize-none outline-none min-h-[80px] placeholder:text-[var(--text-secondary)]"
                maxLength={280}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${newDraftText.length > 260 ? "text-[var(--accent-red)]" : "text-[var(--text-secondary)]"}`}>
                  {newDraftText.length}/280
                </span>
                <div className="flex gap-2">
                  <button onClick={() => { setShowNewDraft(false); setNewDraftText(""); }}
                    className="px-3 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-red)] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleCreateDraft}
                    disabled={!newDraftText.trim()}
                    className="px-3 py-1 text-xs rounded-lg font-medium transition-colors disabled:opacity-40"
                    style={{ background: "rgba(68,102,255,0.15)", color: "var(--accent-blue)" }}>
                    Add Draft
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Draft cards */}
          <div className="space-y-3">
            {filtered.map((draft) => {
              const style = statusStyle[draft.status] || statusStyle.draft;
              const isEditing = editingId === draft._id;
              const fb = feedbackText[draft._id] || "";
              const cat = feedbackCategory[draft._id] || "general";

              return (
                <div key={draft._id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--accent-blue)]/30 transition-colors">
                  {/* Status + time */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: style.color, background: style.bg }}>
                      {style.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {draft.suggestedTime && (
                        <span className="text-[10px] text-[var(--text-secondary)]">{draft.suggestedTime}</span>
                      )}
                      <TimeAgo timestamp={draft.createdAt} />
                    </div>
                  </div>

                  {/* Tweet content — editable */}
                  {isEditing ? (
                    <div className="mb-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-sm resize-none outline-none focus:border-[var(--accent-blue)] min-h-[80px]"
                        maxLength={280}
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-xs ${editText.length > 260 ? "text-[var(--accent-red)]" : "text-[var(--text-secondary)]"}`}>
                          {editText.length}/280
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingId(null)}
                            className="px-2 py-0.5 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            Cancel
                          </button>
                          <button onClick={() => handleSaveEdit(draft._id as Id<"twitter_drafts">)}
                            className="px-2 py-0.5 text-xs rounded font-medium transition-colors"
                            style={{ background: "rgba(34,204,136,0.15)", color: "var(--accent-green)" }}>
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm leading-relaxed whitespace-pre-wrap mb-3 cursor-pointer hover:bg-[var(--bg-hover)] rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => { setEditingId(draft._id); setEditText(draft.content); }}
                      title="Click to edit"
                    >
                      {draft.content}
                    </div>
                  )}

                  {/* Character count bar */}
                  <div className="mb-3">
                    <div className="w-full bg-[var(--bg-primary)] rounded-full h-1">
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${Math.min((draft.content.length / 280) * 100, 100)}%`,
                          background: draft.content.length > 260 ? "var(--accent-red)" : draft.content.length > 200 ? "var(--accent-yellow)" : "var(--accent-green)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 block">{draft.content.length}/280 chars</span>
                  </div>

                  {/* Feedback box — only for actionable drafts */}
                  {draft.status === "draft" && (
                    <div className="border-t border-[var(--border)] pt-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs text-[var(--text-secondary)]">Feedback:</span>
                        {(["tone", "content", "structure", "general"] as FeedbackCategory[]).map((c) => (
                          <button key={c} onClick={() => setFeedbackCategory((prev) => ({ ...prev, [draft._id]: c }))}
                            className={`px-1.5 py-0.5 text-[10px] rounded-full border transition-colors ${
                              cat === c
                                ? "border-transparent font-medium"
                                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)]"
                            }`}
                            style={cat === c ? { color: categoryColors[c].color, background: categoryColors[c].bg } : {}}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={fb}
                        onChange={(e) => setFeedbackText((prev) => ({ ...prev, [draft._id]: e.target.value }))}
                        placeholder="&quot;too formal&quot;, &quot;add more edge&quot;, &quot;this is perfect because...&quot;"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2.5 text-xs resize-none outline-none focus:border-[var(--accent-blue)] min-h-[50px] placeholder:text-[var(--text-secondary)]"
                      />

                      {/* Action buttons */}
                      <div className="flex items-center justify-between mt-2">
                        <button onClick={() => handleSubmitFeedbackOnly(draft._id as Id<"twitter_drafts">, fb, cat)}
                          disabled={!fb.trim()}
                          className="px-3 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors disabled:opacity-30">
                          Save Feedback Only
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleReject(draft._id as Id<"twitter_drafts">, fb, cat)}
                            className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                            style={{ background: "rgba(255,68,102,0.12)", color: "var(--accent-red)" }}>
                            Reject
                          </button>
                          <button onClick={() => handleApprove(draft._id as Id<"twitter_drafts">, fb, cat)}
                            className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                            style={{ background: "rgba(34,204,136,0.12)", color: "var(--accent-green)" }}>
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show existing feedback if present */}
                  {draft.feedback && (
                    <div className="mt-2 p-2 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                      <span className="text-[10px] text-[var(--text-secondary)] block mb-0.5">Last feedback:</span>
                      <span className="text-xs text-[var(--text-primary)]">{draft.feedback}</span>
                    </div>
                  )}

                  {/* Delete for non-draft */}
                  {draft.status !== "draft" && (
                    <div className="flex justify-end mt-2">
                      <button onClick={() => deleteDraft({ id: draft._id as Id<"twitter_drafts"> })}
                        className="px-2 py-0.5 text-[10px] rounded border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-red)] hover:text-[var(--accent-red)] transition-colors">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[var(--text-secondary)]">
                <div className="text-2xl mb-2">🐦</div>
                <div className="text-sm">No tweets in this view</div>
                <div className="text-xs mt-1">Create a draft or wait for Flint to generate some</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── History View ── */}
      {view === "history" && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Training History ({feedback.length} entries)</h3>
          {feedback.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <div className="text-sm">No feedback yet</div>
              <div className="text-xs mt-1">Review some tweets to start building Flint&apos;s style guide</div>
            </div>
          ) : (
            <div className="space-y-2">
              {feedback.map((f) => {
                const catStyle = categoryColors[f.category] || categoryColors.general;
                return (
                  <div key={f._id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: catStyle.color, background: catStyle.bg }}>
                        {f.category}
                      </span>
                      <TimeAgo timestamp={f.createdAt} />
                    </div>
                    <div className="text-sm text-[var(--text-primary)]">{f.feedback}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Stats View ── */}
      {view === "stats" && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">Total Drafts</div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[var(--accent-green)]">{stats.approvalRate}%</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">Approval Rate</div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[var(--accent-blue)]">{stats.totalFeedback}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">Feedback Given</div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[var(--accent-yellow)]">{stats.pending}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">Pending Review</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Status breakdown */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3">Draft Status Breakdown</h4>
              <div className="space-y-2">
                {([["approved", stats.approved, "var(--accent-green)"], ["rejected", stats.rejected, "var(--accent-red)"], ["pending", stats.pending, "var(--accent-yellow)"]] as [string, number, string][]).map(([label, count, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs w-16 text-[var(--text-secondary)] capitalize">{label}</span>
                    <div className="flex-1 bg-[var(--bg-primary)] rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : "0%", background: color }} />
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback categories */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3">Feedback Categories</h4>
              {Object.keys(stats.categoryBreakdown).length === 0 ? (
                <div className="text-xs text-[var(--text-secondary)]">No feedback yet</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.categoryBreakdown).sort(([,a], [,b]) => b - a).map(([cat, count]) => {
                    const catStyle = categoryColors[cat] || categoryColors.general;
                    return (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: catStyle.color, background: catStyle.bg }}>
                          {cat}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">{count} entries</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
    chat: <ChatTab />,
    content: <ContentQueue />,
    twitter: <TwitterTrainingTab />,
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
