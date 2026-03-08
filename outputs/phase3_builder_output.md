# Phase 3 Builder Output — Time Windows & Operations
Date: 2026-03-08

## Feature Objective
Confirm timeout handler, arrival timeout handler, complete state machine with seat/skip/cancel, real-time status page.

## Files Created/Modified

### Libraries
- `src/lib/expiry.ts` — enhanced to expire both CALLED (confirmDeadlineAt) and CONFIRMED (arrivalDeadlineAt) entries

### API Routes (New/Enhanced)
- `POST /api/public/entry/[publicToken]/cancel` — NEW: guest-facing cancel endpoint
  - Validates cancelable states (WAITING, CALLED, CONFIRMED)
  - Sets status=CANCELED, canceledAt=now
  - Returns 400 if invalid state

- `POST /api/restaurants/[id]/entries/[entryId]/seat` — ENHANCED
  - Added state validation (must be CALLED or CONFIRMED)
  - Logs transitions
  - Returns entry details

- `POST /api/restaurants/[id]/entries/[entryId]/skip` — ENHANCED
  - Added state validation (must be CALLED or CONFIRMED)
  - Auto-calls next guest after skip
  - Logs transitions

### Frontend Pages
- `src/app/s/[publicToken]/page.tsx` — ENHANCED
  - Shows CONFIRMED state with message
  - Shows EXPIRED state with warning
  - Shows CANCELED state
  - Cancel button for active guests (WAITING/CALLED/CONFIRMED)
  - Better styling for terminal states

## State Machine Implemented
```
WAITING
  ├─ (call-next) → CALLED
  │   ├─ (confirm via webhook) → CONFIRMED
  │   │   ├─ (seat) → SEATED
  │   │   ├─ (skip) → SKIPPED → (auto call-next)
  │   │   └─ (arrival timeout) → EXPIRED
  │   ├─ (cancel) → CANCELED
  │   └─ (confirm timeout) → EXPIRED
  ├─ (skip) → SKIPPED → (auto call-next)
  └─ (cancel) → CANCELED
```

## Timeout Handlers
- **Confirm Window:** 120 seconds (set by callNext)
  - CALLED → EXPIRED if confirmDeadlineAt < now (via expireEntries)
  
- **Arrival Window:** 300 seconds (set by confirmEntry)
  - CONFIRMED → EXPIRED if arrivalDeadlineAt < now (via expireEntries)

- **Expiry Endpoint:** GET /api/internal/expire
  - Manually trigger expiry checks
  - Returns count of expired entries
  - Can be called by external cron or scheduled task

## Test Results
✅ Full flow: JOIN → CALLED → CANCELED
✅ Cancel endpoint works, validates states
✅ Expire endpoint processes timeouts
✅ Status page shows all states
✅ Skip auto-calls next
✅ Seat validates state
✅ Build: 15 routes, 0 TypeScript errors

## Build
```
npm run build — SUCCESS
Routes: 15
- 8 API routes
- 3 pages
- New: cancel endpoint
```

## Testing Commands
```bash
# Start dev server
npm run dev # runs on 3001 if 3000 taken

# Join
curl -X POST http://localhost:3001/api/public/restaurants/test/join \
  -H "Content-Type: application/json" \
  -d '{"partySize":2,"phone":"0741234567"}'

# Get status
curl http://localhost:3001/api/public/entry/{token}

# Cancel
curl -X POST http://localhost:3001/api/public/entry/{token}/cancel

# Trigger expiry
curl http://localhost:3001/api/internal/expire
```

## Known Gaps / Handoff
- Expiry cron: not yet scheduled (needs external cron service or Next.js middleware)
- Skip endpoint could log automatic call-next result
- No recovery mechanism (expired entries stay expired)
- Guest can't recover after timeout

## Next Phase: Phase 4 — Polishing
- Service layer abstractions
- Reservation extension points
- ETA calculation service
- Analytics-ready event storage (MessageEvent already implemented)

## Mandatory Output Files
✅ /outputs/phase3_builder_output.md (this file)
✅ QA output (to follow)
✅ DevOps output (to follow)
✅ Product output (to follow)
✅ Final orchestrator summary (to follow)
