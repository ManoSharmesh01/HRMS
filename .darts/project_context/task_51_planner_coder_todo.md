# Planner-Coder Todo — 51
**Requirement:** Build the Employee Directory interface mapping staff lists, complete modal profiles, and action controls.

Acceptance Criteria:
- Renders complete list of employees inside a responsive grid or robust table structure
- Clicking Add Employee loads a dialog modal allowing creation of custom staff profiles with real-time validation checks
- Editing details correctly submits updates to the API and triggers dynamic list refreshes

Technical Hints: Use React Hook Form or standard state managers to handle modal data. Re-fetch employee listings after saving changes.

Dependencies: Task frontend_shell_and_routes, Task employee_crud_api

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- `frontend/src/App.tsx`: Routes and ProtectedRoute layout
- `frontend/src/components/Sidebar.tsx`: Navigation menu

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- `frontend/src/App.tsx`: add `<Route path="employees" element={<Employees />} />` and import `Employees` from `./pages/Employees`
- `frontend/src/components/Sidebar.tsx`: add `{ name: 'Employees', path: '/employees', icon: Users }` to `menuItems` and import `Users` from `'lucide-react'`

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Backend (Verification / No-op) | — | completed | — |
| T-002 | Entry points — Router and Sidebar Registration | `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx` | completed | — |
| T-003 | Frontend services (No-op) | — | completed | — |
| T-004 | Frontend UI — Employee Directory, Modals, Validation, Actions | `frontend/src/pages/Employees.tsx` | completed | T-002 |
