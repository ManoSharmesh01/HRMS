# Planner-Coder Todo — 56
**Requirement:** Integrate automatic backend database log transactions executing on user mutations to trace company operations and security events.

Acceptance Criteria:
- Mutations (leave status changes, attendance check-ins, employee profile saves) trigger automatic database logs
- Log messages cleanly specify details of the changed records and actors
- Dashboard audit feeds display real-time event updates dynamically fetched from the SQLite Activity logs table

Technical Hints: Create generic middleware or a centralized database utility function that programmatically inserts system activity entries on successful POST/PUT/DELETE API executions.

Dependencies: Task dashboard_analytics_api, Task employee_crud_api, Task leave_management_api

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: cors, express.json, activityLogger, authenticateToken, prisma routes
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx: useQuery, api.get('/dashboard/stats'), recentActivities mapping

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: Enhance activityLogger to include record details (e.g., name, type) in the log message.
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx: Ensure actor display is polished and real-time fetching is consistent.

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Backend — Enhance activityLogger middleware and Prisma schema | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\prisma\schema.prisma | pending | — |
| T-002 | Frontend UI — Dashboard audit feed display | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx | pending | T-001 |

| T-001 | Backend — Enhance activityLogger middleware and Prisma schema | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\prisma\schema.prisma | completed | — |
| T-002 | Frontend UI — Dashboard audit feed display | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx | completed | T-001 |