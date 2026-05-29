# Planner-Coder Todo — 58
**Requirement:** Build custom Tailwind CSS skeleton blocks, unified error boundary banners, and beautiful visual illustrations for missing data states to elevate the user experience.

Acceptance Criteria:
- All dynamic panels display pulse-loading templates during API requests
- System failures render distinct visual warnings containing retry components rather than empty pages
- Empty state illustration cards render whenever a list query returns zero database matching entries

Technical Hints: Create modular loading component equivalents for tables, grids, and KPI blocks. Leverage custom animated pulse utility classes in Tailwind.

Dependencies: Task frontend_shell_and_routes

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- frontend/src/App.tsx: AuthProvider, QueryClientProvider, BrowserRouter, Routes, ProtectedRoute, PublicRoute, Layout, Login, Dashboard, Employees, Attendance, Leaves
- frontend/src/main.tsx: App, index.css, React.StrictMode

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- frontend/src/components/common/index.ts: export all common components
- frontend/src/components/common/GlobalErrorBoundary.tsx: new component
- frontend/src/App.tsx: add GlobalErrorBoundary wrapper around the main application content

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Enhance Common UI Components | frontend/src/components/common/Skeleton.tsx, frontend/src/components/common/ErrorBanner.tsx, frontend/src/components/common/EmptyState.tsx, frontend/src/components/common/index.ts | pending | — |
| T-002 | Implement Global Error Boundary & App Integration | frontend/src/components/common/GlobalErrorBoundary.tsx, frontend/src/App.tsx | pending | T-001 |
