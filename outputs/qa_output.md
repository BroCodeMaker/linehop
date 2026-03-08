# QA Output — Phase 1
Date: 2026-03-08

## Test Results

| Test | Endpoint | Expected | Result |
|------|----------|----------|--------|
| T1 | POST /api/public/restaurants/test/join | 200, publicToken, position:1 | ✅ PASS |
| T2 | GET /api/public/entry/{token} | status:WAITING, position:1 | ✅ PASS |
| T3 | GET /api/restaurants/{id}/queue | 1 entry | ✅ PASS |
| T4 | POST /api/restaurants/{id}/call-next | status:CALLED, phoneE164:+40741234567 | ✅ PASS |
| T5 | POST /api/restaurants/{id}/entries/{id}/seat | {"ok":true} | ✅ PASS |
| T6 | POST join + call-next + skip | skip → {"ok":true} | ✅ PASS |
| T7 | POST join with invalid slug | 404 "Restaurant not found" | ✅ PASS |
| T8 | GET /api/internal/expire | {"ok":true,"expired":0} | ✅ PASS |

## State Machine Verified
- WAITING → CALLED (call-next) ✅
- CALLED → SEATED (seat) ✅
- CALLED → SKIPPED (skip) ✅
- Phone normalization: 0741234567 → +40741234567 ✅

## Build
- npm run build: ✅ 0 errors, 14 routes

## Dev Server
- Running on http://localhost:3000 ✅
- Join page: /r/test ✅
- Status page: /s/{token} ✅
- Dashboard: /app/{restaurantId}/dashboard ✅

## Known Issues (acceptable for Phase 1)
- No auth on dashboard (by design for MVP)
- Webhook route is stub (Phase 2)
- No rate limiting (Phase 3)
- Expiry cron not scheduled automatically

## Pass Criteria
✅ All critical paths work end-to-end
✅ Build clean
✅ State machine correct

QA: PASSED — ready for DevOps
