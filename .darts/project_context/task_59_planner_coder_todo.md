# Planner-Coder Todo — 59
**Requirement:** Integrate light and dark theme capabilities utilizing React context variables linked to custom Tailwind styles.

Acceptance Criteria:
- Global theme toggler matches stored local-storage settings across browser refreshes
- Toggling light/dark modes smoothly applies dark classes across elements
- SaaS components (sidebar, panels, cards, dashboard inputs) present premium colors and layouts in dark mode

Technical Hints: Toggle the 'dark' utility class on the root HTML/document-body object, and define customized background/border/text configurations with dark: modifiers.

Dependencies: Task frontend_shell_and_routes

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\main.tsx: imports App, index.css
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx: AuthProvider, QueryClientProvider, BrowserRouter
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\tailwind.config.js: content, theme configuration
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Layout.tsx: Sidebar, Outlet
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx: NavLink, useAuth

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\main.tsx: add ThemeProvider
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx: add ThemeProvider wrapper (alternative to main.tsx if more context is needed)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\tailwind.config.js: add `darkMode: 'class'`
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx: add ThemeToggle component
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Layout.tsx: add dark: classes to main container

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Frontend Theme Context & Config | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\context\ThemeContext.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\App.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\tailwind.config.js, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\index.css | completed | — |
| T-002 | Frontend UI - Components & Dark Mode | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\common\ThemeToggle.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Layout.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\components\Sidebar.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Dashboard.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Attendance.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Employees.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Leaves.tsx, \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\frontend\src\pages\Login.tsx | completed | T-001 |
