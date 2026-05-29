# Planner-Coder Todo — 42
**Requirement:** Write a robust database seed script in TypeScript to populate SQLite with comprehensive corporate data including employees, past check-ins, leave requests, upcoming calendar events, and activities.

Acceptance Criteria:
- Script successfully seeds at least 15 unique, realistic employees with varied roles and departments
- Generates daily historic attendance patterns (clock-ins/outs) for the past 30 days including realistic variation
- Inserts diverse leave requests (Pending, Approved, Rejected) with corresponding date spreads
- Creates realistic audit trail activity logs and company-wide events
- Database seeding runs successfully via npm run seed or npx prisma db seed without warnings

Technical Hints: Use @faker-js/faker or write static structured arrays of data. Ensure passwords are properly hashed with bcrypt during seed generation. Create records in sequence to prevent constraint errors.

Dependencies: Task database_backend_setup

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- package.json: dependencies and scripts
- prisma/schema.prisma: original model structures

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- package.json: add "seed" script, and "prisma.seed" configuration
- prisma/seed.ts: create a comprehensive seeding script

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Create and configure database seed script | package.json, prisma/seed.ts | completed | — |
