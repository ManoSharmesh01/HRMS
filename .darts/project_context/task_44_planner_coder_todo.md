# Planner-Coder Todo — 44
**Requirement:** Create dynamic CRUD REST APIs for administration and organization profile tracking of system users.

Acceptance Criteria:
- GET /api/employees retrieves dynamic lists of employees excluding sensitive password fields
- POST /api/employees validates payload and successfully registers a new employee card
- PUT /api/employees/:id correctly updates editable fields (department, role, status, email) in SQLite
- DELETE /api/employees/:id performs cascade operations or soft deletion of target employee records

Technical Hints: Check for existing duplicate emails before database commits. Return consistent structure payloads from Prisma.

Dependencies: Task database_backend_setup, Task jwt_auth_backend

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: Express routes and authentication middlewares.

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts: add dynamic GET /api/employees filter, validate/duplicate check POST /api/employees, validation and duplicate check PUT /api/employees/:id, explicit cascade DELETE /api/employees/:id.

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Implement Employee CRUD API | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | completed | — |
| T-002 | Entry points routing registration | \DARTS-development-environment\sandbox\rmanoj\HRMS Portal\src\index.ts | completed | T-001 |
