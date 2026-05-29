# Planner-Coder Todo — 52
**Requirement:** Construct the Attendance workspace interface containing status panels, custom active clock controls, and history logs.

Acceptance Criteria:
- Interactive widget shows real-time checkout buttons with elapsed shift duration counters
- Clicking buttons launches instant API calls, changing frontend statuses dynamically
- Renders a chronological tracking grid showing personal clocking history, times, and lateness indicators

Technical Hints: Use an interval-based helper (setInterval) on the active session clock to compute real-time shift timers while checked-in.

Dependencies: Task frontend_shell_and_routes, Task attendance_tracking_api

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx: Layout, Login, Dashboard, Employees routes registered
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx: Sidebar links for Dashboard and Employees

### Planned (add exactly these in STEP 3)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx: Add "Attendance" navigation link with Clock icon from lucide-react (Added)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx: Register the `/attendance` route pointing to `<Attendance />` page within the layout (Added)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Attendance.tsx: Implement full Attendance workspace, real-time counters, status panels, and history log list (Created)

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Create Attendance workspace page component with real-time counters, status panels, and history grid | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Attendance.tsx | completed | — |
| T-002 | Register route and update sidebar navigation for Attendance workspace | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx | completed | T-001 |
