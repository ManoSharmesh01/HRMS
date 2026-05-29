# Planner-Coder Todo — 50
**Requirement:** Create the dynamic Dashboard layout displaying statistical summary cards, performance charts, relative event logs, and dynamic company schedules.

Acceptance Criteria:
- Analytical KPI blocks display accurate values directly pulled from the dashboard stats API endpoint
- Visual interactive graphs map headcount trends and activity logs cleanly using lightweight charts
- Dynamic listings of recent logs and calendar events show relative time formats without page breakages

Technical Hints: Integrate Recharts components (AreaChart, BarChart, ResponsiveContainer) configured with dynamic JSON payloads returned from backend endpoints.

Dependencies: Task frontend_shell_and_routes, Task dashboard_analytics_api

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- None

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- `frontend/package.json`: add `"recharts": "^2.12.2"`
- `src/index.ts`: update `/api/dashboard/stats` to return `headcountTrend` and `activityLogsTrend`
- `frontend/src/pages/Dashboard.tsx`: import Recharts components and render KPI cards, AreaChart, BarChart, recent activities with relative time formats, and dynamic company schedules with relative date formatting.

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Update Backend Statistics Endpoint | `src/index.ts` | completed | — |
| T-002 | Install Frontend Recharts Package | `frontend/package.json` | completed | T-001 |
| T-003 | Update Dashboard UI Component | `frontend/src/pages/Dashboard.tsx` | completed | T-002 |
