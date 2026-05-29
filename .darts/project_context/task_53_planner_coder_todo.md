# Planner-Coder Todo — 53
**Requirement:** Develop the Leave Requests overview board displaying submission forms, balances, and admin approval matrices.

Acceptance Criteria:
- Modal form provides straightforward leave submissions specifying categories and date-pickers
- HR/Admin lists display custom action badges to Approve/Reject outstanding requests
- Action approvals trigger backend updates and instantly reload table data without hard page reloads

Technical Hints: Disable approval actions for normal employees. Conditionally render the actions column depending on user role.

Dependencies: Task frontend_shell_and_routes, Task leave_management_api

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- frontend/src/App.tsx: Route elements and ProtectedRoute imports
- frontend/src/components/Sidebar.tsx: Sidebar items and menu definitions

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- frontend/src/App.tsx: import Leaves and add Route path="leaves"
- frontend/src/components/Sidebar.tsx: add Leave Requests menu item with icon

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Minor Backend Tweak / Check | src/index.ts | completed | — |
| T-002 | Entry points integration | frontend/src/App.tsx, frontend/src/components/Sidebar.tsx | completed | T-001 |
| T-003 | Frontend UI Page & Balance Cards | frontend/src/pages/Leaves.tsx | completed | T-002 |
