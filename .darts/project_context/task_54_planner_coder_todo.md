# Planner-Coder Todo — 54
**Requirement:** Extend both backend query controls and frontend directory views to support cursor/offset pagination, multi-value state filters, and search bar debouncing.

Acceptance Criteria:
- Adding query terms in search bar triggers debounced API requests and renders relevant results only
- Selecting dropdown metrics (department, type, status) filters directory entries in real-time
- Pagination buttons allow navigations across dynamic datasets, loading subsequent batches smoothly

Technical Hints: Add skip and take directives on Prisma requests. Implement client-side debounce helpers (e.g. useDebounce hooks) to avoid hitting database APIs on every keystroke.

Dependencies: Task employee_crud_api, Task attendance_tracking_api, Task leave_management_api, Task employee_management_view, Task attendance_tracker_view, Task leave_requests_view

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: app.get('/api/employees'), app.get('/api/leaves')

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: add parseMultiValueParam helper and update app.get('/api/employees') and app.get('/api/leaves') routes
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\hooks\useDebounce.ts: add useDebounce React hook
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Employees.tsx: import useDebounce, add pagination controls, use debouncedSearch in useQuery
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Leaves.tsx: import useDebounce, add search input, add pagination controls, use debouncedSearch in useQuery

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Backend Query Controls Update | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | completed | — |
| T-002 | Frontend Debounce Hook | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\hooks\useDebounce.ts | completed | T-001 |
| T-003 | Frontend Directory UI Integration | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Employees.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Leaves.tsx | pending | T-002 |
