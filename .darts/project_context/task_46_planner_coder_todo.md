# Planner-Coder Todo — 46
**Requirement:** Develop the leave management API allowing employees to request leave and managers to review, accept, or reject outstanding requests.

Acceptance Criteria:
- POST /api/leaves records active leave requests mapping category, duration range, and justification details
- GET /api/leaves fetches request streams: scope limited to personal history for EMPLOYEES, or global list for ADMIN/HR roles
- PATCH /api/leaves/:id/status allows HR/Managers to approve/reject leaves, modifying status dynamically in SQLite

Technical Hints: Ensure leave requests contain validations ensuring startDate is earlier than endDate.

Dependencies: Task database_backend_setup, Task jwt_auth_backend

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- C:\DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: app, cors, express, bcrypt, jwt, prisma, authenticateToken, authorizeRoles already registered

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- C:\DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: add PATCH /api/leaves/:id/status and update POST /api/leaves, GET /api/leaves

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Backend API Implementation | C:\DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | completed | — |
