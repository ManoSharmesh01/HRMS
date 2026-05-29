# Planner-Coder Todo — 47
**Requirement:** Develop a high-performance consolidated dashboard telemetry API that aggregates metrics and logs from across database models to drive the home page view.

Acceptance Criteria:
- GET /api/dashboard/stats returns aggregate dashboard numbers (active employees count, present rate today, outstanding leaves, total events)
- Dynamic calculations are resolved from current database snapshots without hardcoded fallbacks
- Includes recent activity records and upcoming calendar event details in the dashboard metrics payload

Technical Hints: Optimize query executions. Combine aggregate counts and recent activities into a single JSON payload using Prisma's count and findMany utility methods.

Dependencies: Task database_backend_setup

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- src/index.ts: Express application entry point with authentication, employee, leave, activity, and event routes

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- src/index.ts: add public /api/dashboard/stats telemetry endpoint

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Implement dynamic telemetry and dashboard analytics in the dashboard stats route | src/index.ts | completed | — |
| T-002 | Verify and ensure database seed works with dynamic calculations | prisma/seed.ts, src/index.ts | completed | T-001 |
