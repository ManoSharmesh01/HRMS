# Planner-Coder Todo — 49
**Requirement:** Design a beautiful frontend login layout handling JWT storage, API request configurations, dynamic session restoration, and router access controls.

Acceptance Criteria:
- Responsive visual login card provides validation indicators on incomplete credentials
- Submits inputs to backend login API, writes authenticated token to secure storage, and navigates successfully into Dashboard
- Page refresh seamlessly maintains state using backend API verification checks
- Attempting to navigate directly to protected dashboard paths redirects unauthenticated users to login page

Technical Hints: Store JWT tokens inside LocalStorage or Cookies. Configure Axios interceptors to automatically attach Bearer token strings on backend API calls.

Dependencies: Task frontend_shell_and_routes, Task jwt_auth_backend

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- frontend/src/services/api.ts: Axios instance with request and response interceptors
- frontend/src/context/AuthContext.tsx: AuthProvider context definition

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- frontend/src/context/AuthContext.tsx: session verification with backend /auth/me on refresh
- frontend/src/App.tsx: Route component update to utilize verified user state & session loading
- frontend/src/pages/Login.tsx: validation indicators, responsive modern visual layout

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Update Frontend Services & Context | frontend/src/context/AuthContext.tsx | completed | — |
| T-002 | Update Frontend UI & Entry Router | frontend/src/pages/Login.tsx, frontend/src/App.tsx | completed | T-001 |
