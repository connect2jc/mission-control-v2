# Mission Control v2 — Convex Setup

## One-time setup (requires browser login)

```bash
cd /Users/juhi/.openclaw/mission-control-convex

# 1. Login to Convex (opens browser)
npx convex login

# 2. Initialize project + deploy schema
npx convex dev --once --configure new
# When prompted: project name = "mission-control"

# 3. Seed data (10 agents + 15 tasks + activities)
npx convex run seed:seedAgents

# 4. Copy deployment URL to .env
# The URL will be shown during setup — add it to:
# /Users/juhi/.openclaw/.env as CONVEX_URL=<your-url>
```

## After setup
- All 7 tables created: agents, tasks, messages, activities, documents, notifications, memories
- 10 agents seeded with roles and channels
- 15 tasks migrated from TASKS.md
- Dashboard: `npx convex dashboard` to view in browser

## Agent Integration
Agents can interact via:
```bash
npx convex run notifications:getUndelivered '{"agentId": "<id>"}'
npx convex run messages:create '{"fromAgentId": "<id>", "content": "update"}'
npx convex run tasks:update '{"id": "<id>", "status": "done"}'
npx convex run memories:create '{"agentId": "<id>", "content": "learned X", "category": "lesson", "importance": "high"}'
```
