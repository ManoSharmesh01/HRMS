# Planner-Coder Todo — 45
**Requirement:** Implement timesheet operations API for tracking check-ins, check-outs, and tracking status parameters.

Acceptance Criteria:
- POST /api/attendance/check-in creates a timesheet record with today's date, timestamp, status (Present/Late) based on threshold hours
- POST /api/attendance/check-out updates today's timesheet record, calculating the precise active work hours elapsed
- GET /api/attendance/today fetches the session employee's current clocking state for the dashboard ui
- GET /api/attendance/history lists authenticated employee's active records

Technical Hints: Compare clock-in hour against a standard company shift threshold (e.g. 09:00 AM) to programmatically tag status as 'Present' or 'Late'.

Dependencies: Task database_backend_setup, Task jwt_auth_backend

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- src/index.ts: Authentication middleware, Existing APIs, Express app configuration

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- src/index.ts: add POST /api/attendance/check-in, POST /api/attendance/check-out, GET /api/attendance/today, GET /api/attendance/history

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Backend - Implement timesheet operations API controllers | src/index.ts | completed | — |
| T-002 | Entry points - Register routes and initialize DB sync | src/index.ts | completed | T-001 |
