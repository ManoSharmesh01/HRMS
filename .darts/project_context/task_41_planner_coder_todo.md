# Planner-Coder Todo — 41
**Requirement:** Configure the base Node.js/TypeScript backend, install essential server dependencies (Express, CORS, Prisma, JWT, Bcrypt), define the SQLite schema models with relations, and instantiate the Prisma client.

Acceptance Criteria:
- Express server boots cleanly with TypeScript and nodemon without runtime errors
- Prisma schema file defines clean relationships between models: User/Employee, Attendance, Leave, Activity, Event
- Development database file dev.db compiles and initializes cleanly
- Database schema migrations run successfully on command line

Technical Hints: Install express, @prisma/client, typescript, ts-node, and sqlite3. Use npx prisma init --datasource-provider sqlite. Create standard models for Employee (id, name, email, password, role, department, salary, status), Attendance (id, employeeId, date, checkIn, checkOut, status, totalHours), Leave (id, employeeId, type, startDate, endDate, reason, status), Activity (id, message, module, type, createdAt), and Event (id, title, date, type).

---

## Wiring Manifest

### Existing (preserve every line when modifying these files)
- None

### Planned (add exactly these in STEP 3 — decided now, not during coding)
- src/index.ts: Main Express entry point with integrated routes, middlewares, and db synchronization
- src/prisma.ts: Prisma client singleton instance

---

## All Tasks

| ID | Task | Files | Status | Depends On |
|---|---|---|---|---|
| T-001 | Backend Configuration & Database Models | package.json, tsconfig.json, prisma/schema.prisma, prisma/migrations/20250101000000_init/migration.sql, prisma/migrations/migration_lock.toml | completed | — |
| T-002 | Server & Prisma Client Setup | src/prisma.ts, src/index.ts | completed | T-001 |
