# Phase 3 QA Output — Time Windows & Operations
Date: 2026-03-08

## Test Results

| Test | Scenario | Expected | Result |
|------|----------|----------|--------|
| T1 | Join → Status (WAITING) | position=1, queueLength=1 | ✅ PASS |
| T2 | Call-next | status→CALLED, confirmDeadlineAt set | ✅ PASS |
| T3 | Cancel from WAITING | status→CANCELED | ✅ PASS |
| T4 | Cancel from CALLED | status→CANCELED | ✅ PASS |
| T5 | Seat from CALLED | status→SEATED, seatedAt set | ✅ PASS |
| T6 | Skip from CALLED | status→SKIPPED, next guest called | ✅ PASS |
| T7 | Expire endpoint | runs expireEntries(), returns count | ✅ PASS |
| T8 | Status page CALLED | shows alert, shows confirm deadline | ✅ PASS |
| T9 | Status page EXPIRED | shows expired state badge | ✅ PASS |
| T10 | Status page CANCELED | shows canceled badge | ✅ PASS |

## State Machine Verified
- WAITING → CALLED ✅
- CALLED → SEATED ✅
- CALLED → SKIPPED (auto-calls next) ✅
- WAITING/CALLED/CONFIRMED → CANCELED ✅
- CALLED → EXPIRED (timeout) ✅
- CONFIRMED → EXPIRED (timeout) ✅

## Build
✅ npm run build — 0 errors, 15 routes

## Timeouts
- Confirm window: 120 seconds (verified in test)
- Arrival window: 300 seconds (via code review)
- Expiry cron: callable via /api/internal/expire

## UI/UX
- Cancel button visible for active bookings ✅
- Status page auto-refreshes every 15s ✅
- All states shown with proper colors ✅

## Pass Criteria
✅ All critical paths verified
✅ State machine correct
✅ Build clean
✅ Timeouts implemented

QA: PASSED — ready for DevOps
