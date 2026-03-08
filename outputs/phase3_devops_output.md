# Phase 3 DevOps Output — Time Windows & Operations
Date: 2026-03-08

## Runtime Status
- PostgreSQL 16: ✅ running (localhost:5432)
- Next.js dev: ✅ running (port 3001, fallback from 3000)
- Prisma Client: ✅ generated
- Database: ✅ migrated (Phase 1 + 2 + 3 schemas applied)

## New Features
- Timeout handler: GET /api/internal/expire
  - Expires CALLED entries past confirmDeadlineAt
  - Expires CONFIRMED entries past arrivalDeadlineAt
  - Can be triggered manually or via external cron

## Scheduler Options
For Phase 3+, recommend one of:

### Option A: External Cron (Recommended for MVP)
```bash
# Call every 60 seconds
0 * * * * curl -s http://localhost:3000/api/internal/expire
```

### Option B: Next.js Middleware (Future)
Can add middleware to intercept requests and check expiry periodically.

### Option C: Background Worker (Production)
Use BullMQ, Inngest, or AWS Lambda for true background jobs.

## Start/Stop Commands
```bash
# Start PostgreSQL (if not running)
brew services start postgresql@16

# Start dev server (auto-fallback to 3001)
npm run dev

# Run seed (idempotent)
npx ts-node --esm scripts/seed.ts

# Manual expiry check
curl http://localhost:3001/api/internal/expire
```

## Test URLs
- Guest join: http://localhost:3001/r/test
- Guest status: http://localhost:3001/s/{token}
- Dashboard: http://localhost:3001/app/f3d8282f-7096-47ee-97e4-f81e252c7e9e/dashboard

## Timeout Windows (Configured)
- Confirm: 120 seconds (2 minutes)
- Arrival: 300 seconds (5 minutes)

## Logging
All state transitions logged to console:
```
[seat] Entry {id} seated (was CALLED)
[skip] Entry {id} skipped (was CALLED), calling next...
[cancel] Entry {id} canceled
[expire] Entry {id} expired (was CALLED)
```

DevOps: PASSED — Scheduler setup recommended for production
