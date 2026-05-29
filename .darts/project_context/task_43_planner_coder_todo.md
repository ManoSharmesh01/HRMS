# Planner-Coder Todo — 43
**Requirement:** Implement secure JWT-based backend authentication including secure routing, Bcrypt password matching, and fine-grained Role-Based Access Control (RBAC) middleware for ADMIN, HR, MANAGER, and EMPLOYEE tiers.

Acceptance Criteria:
- POST /api/auth/login validates credentials, returning a signed JWT and user metadata
- GET /api/auth/me verifies incoming request bearer token, resolving current session details
- Custom RBAC middleware rejects unauthorized roles with 403 Forbidden and invalid tokens with 401 Unauthorized
- Authorization header schema correctly parsed on API controllers

Technical Hints: Configure jsonwebtoken with appropriate secret expiry configurations. Guard employee routing controllers using custom role authorization validators.

Dependencies: Task database_backend_setup

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: Express API endpoints, automatic DB seed on startup, and health check routes.

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: add JWT-based authentication middleware, RBAC authorization middleware, POST /api/auth/login response alignment, and GET /api/auth/me route.

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Implement robust Authorization schema parser and Bcrypt login controller | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | completed | — |
| T-002 | Implement GET /api/auth/me session details resolver | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | completed | T-001 |
| T-003 | Implement fine-grained Role-Based Access Control (RBAC) middleware and guard employee controllers | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | completed | T-002 |
