# Planner-Coder Todo — 60
**Requirement:** Construct a comprehensive interactive visual calendar on the client-side displaying upcoming events, public holidays, and scheduled employee leaves.

Acceptance Criteria:
- Dynamic monthly/weekly calendar grid mounts on the workspace board
- Calendar correctly plots colored marker bubbles or banners representing company events and approved leaves on respective dates
- Clicking scheduled markers displays popup badges with descriptions

Technical Hints: Integrate date-fns or standard JavaScript Date logic to calculate precise calendar grids, mapping dynamic event dates directly to individual visual blocks.

Dependencies: Task frontend_shell_and_routes

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: Auth, Employee, Attendance, Leave, Activity, Dashboard routes
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx: Layout, Login, Dashboard, Attendance, Employees, Leaves routes
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx: Dashboard, Attendance, Employees, Leave Requests links

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: add GET /api/calendar/data
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx: add Workspace route
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx: add Workspace link

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Backend - Calendar API & Seeding | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | pending | — |
| T-002 | Frontend Wiring & Sidebar | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx | pending | T-001 |
| T-003 | Frontend Workspace UI | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Workspace.tsx | pending | T-002 |
