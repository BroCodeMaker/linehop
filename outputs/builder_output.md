# Builder Output — Phase 1
Date: 2026-03-08

## Feature Objective
Core vertical slice: guest join flow, queue management, dashboard, call-next, status page.

## Phase 0 (Orchestrator)
- ✅ PostgreSQL 16 installed + started via brew services
- ✅ Database "waitlist" created, user "postgres" created
- ✅ .env file created with DATABASE_URL + mock WhatsApp config
- ✅ npm install (--legacy-peer-deps for React 19 compat)
- ✅ prisma migrate dev --name init (migration applied)
- ✅ Prisma Client generated

## Files Created / Modified

### Libraries
- `src/lib/prisma.ts` — PrismaClient singleton (fixed)
- `src/lib/queue.ts` — getQueue, callNext, seatEntry, skipEntry, cancelEntry
- `src/lib/phone.ts` — Romanian E.164 normalization (07xx → +407xx)
- `src/lib/status.ts` — getPositionInQueue, estimateEtaMinutes
- `src/lib/notify.ts` — mock WhatsApp (console.log only)
- `src/lib/expiry.ts` — expireEntries() for CALLED past deadline

### API Routes
- `POST /api/public/restaurants/[slug]/join` — validated join, creates WAITING entry
- `GET  /api/public/entry/[publicToken]` — guest status lookup
- `POST /api/restaurants/[id]/call-next` — WAITING → CALLED + mock WhatsApp
- `GET  /api/restaurants/[id]/queue` — active queue for dashboard
- `POST /api/restaurants/[id]/entries/[entryId]/seat` — → SEATED
- `POST /api/restaurants/[id]/entries/[entryId]/skip` — → SKIPPED
- `GET  /api/internal/expire` — expire CALLED entries past deadline

### Frontend Pages
- `src/app/layout.tsx` — root layout (was missing, created)
- `src/app/r/[slug]/page.tsx` — Guest join form (mobile-friendly)
- `src/app/s/[publicToken]/page.tsx` — Guest status page (auto-refresh 15s)
- `src/app/app/[restaurantId]/dashboard/page.tsx` — Host dashboard (auto-refresh 10s)

### Scripts
- `scripts/seed.ts` — seeds Test Restaurant + admin@test.com/admin123

## Seed Data
- Restaurant: "Test Restaurant", slug: "test"
- Restaurant ID: f3d8282f-7096-47ee-97e4-f81e252c7e9e
- Admin: admin@test.com / admin123

## Test URLs
- Join page: http://localhost:3000/r/test
- Dashboard: http://localhost:3000/app/f3d8282f-7096-47ee-97e4-f81e252c7e9e/dashboard

## Build Status
✅ npm run build — SUCCESS (all 15 routes compiled, 0 TypeScript errors)

## Phase 1 Completion — 2026-03-08
All stubs replaced with real Prisma implementations. bcryptjs installed. Seed script confirmed working. Build clean.

## What Works
- Guest can join via QR → form → status page
- Status page auto-refreshes every 15s
- Dashboard shows live queue with CALL NEXT / SEAT / SKIP
- call-next sends mock WhatsApp (console.log)
- Expiry endpoint ready for cron

## Known Gaps / Handoff to QA
- WhatsApp is mock only (no real sends) — by design
- No auth on dashboard — acceptable for Phase 1 MVP
- No cancel endpoint UI yet
- Webhook /api/webhooks/whatsapp is still a stub (Phase 2)
- No rate limiting on join endpoint yet
- Expiry cron not scheduled (needs external cron or Next.js cron job)

## Next Agent: QA
Verify all endpoints with curl tests, check state machine transitions.
