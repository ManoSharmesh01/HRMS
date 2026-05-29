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
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\prisma\schema.prisma: Activity model
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: authenticateToken, express.json()
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx: useQuery for dashboardStats

### Planned (add exactly these in STEP 3 — decided now, not during coding)
| T-001 | Backend: Activity Logger Middleware & Schema | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\prisma\schema.prisma, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | completed | — |
| T-002 | Frontend: Dashboard Audit Feed Enhancements | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx | completed | T-001 |
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx: ensure real-time refetching and display of actor info if available

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Backend: Activity Logger Middleware & Schema | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\prisma\schema.prisma, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | pending | — |
| T-002 | Frontend: Dashboard Audit Feed Enhancements | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx | pending | T-001 |
