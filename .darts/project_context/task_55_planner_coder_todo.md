# Planner-Coder Todo — 55
**Requirement:** Add client-side or backend-generated CSV compilation utilities, making employee data, leave balance registers, and work schedules easily downloadable.

Acceptance Criteria:
- Clicking Export downloads formatted CSV spreadsheets containing exact filtered records from the table
- File maps appropriate headers: Employee Name, Date, Status, Department, or dynamic timesheet variables
- CSV structures open cleanly inside default spreadsheet suites (Excel, Numbers, Sheets) with proper formatting

Technical Hints: Implement standard vanilla Javascript CSV parser helpers, converting rows of objects into URI-encoded data string triggers.

Dependencies: Task employee_management_view, Task attendance_tracker_view, Task leave_requests_view

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- frontend/src/pages/Employees.tsx: imports, state, useQuery, JSX
- frontend/src/pages/Attendance.tsx: imports, state, useQuery, JSX
- frontend/src/pages/Leaves.tsx: imports, state, useQuery, JSX

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- frontend/src/utils/csvUtils.ts: create exportToCSV helper
- frontend/src/pages/Employees.tsx: import exportToCSV, add Export button in header
- frontend/src/pages/Attendance.tsx: import exportToCSV, add Export button in header
- frontend/src/pages/Leaves.tsx: import exportToCSV, add Export button in header

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Frontend Utility | frontend/src/utils/csvUtils.ts | completed | — |
| T-002 | Frontend UI Updates | frontend/src/pages/Employees.tsx, frontend/src/pages/Attendance.tsx, frontend/src/pages/Leaves.tsx | completed | T-001 |
