# Phase 2 Builder Output — Messaging
Date: 2026-03-08

## Feature Objective
WhatsApp adapter abstraction + inbound webhook + message logging

## Files Created/Modified

### Core Libraries
- `src/lib/notification-adapter.ts` — abstraction layer (mock + real WhatsApp)
- `src/lib/queue.ts` — added confirmEntry() function
- `src/lib/notify.ts` — updated to log message events to DB
- `src/lib/expiry.ts` — updated to expire CONFIRMED entries past arrivalDeadlineAt

### Database
- `prisma/schema.prisma` — added MessageEvent model
- Migration: 20260308134708_add_message_events (applied ✅)

### API Routes
- `POST /api/webhooks/whatsapp` — receive inbound confirmations from guests
  - Verifies webhook signature (mock always trusts for local dev)
  - Finds CALLED entry by phone + status
  - Updates status to CONFIRMED + sets arrivalDeadlineAt
  - Logs inbound message event

### Updated Endpoints
- `POST /api/restaurants/[id]/call-next` — now passes entryId to sendWhatsAppMessage
- `GET /api/public/entry/[publicToken]` — now returns confirmDeadlineAt + arrivalDeadlineAt

## State Machine Transitions
- WAITING → CALLED (call-next, sets confirmDeadlineAt = now + 120s)
- CALLED → CONFIRMED (webhook receive CONFIRM, sets arrivalDeadlineAt = now + 300s)
- CALLED → EXPIRED (expiry cron, if past confirmDeadlineAt)
- CONFIRMED → EXPIRED (expiry cron, if past arrivalDeadlineAt)

## Message Events Logged
- Outbound: call-next sends message (status=sent)
- Inbound: webhook receives CONFIRM (status=received)
- All events stored in MessageEvent table with provider, phoneE164, body, timestamps

## Testing
✅ End-to-end test: join → call-next (CALLED) → webhook CONFIRM → CONFIRMED
✅ Message events created for both outbound + inbound
✅ Arrival deadline set when guest confirms

## Build
✅ npm run build — 0 errors, 14 routes

## What's Implemented
- WhatsApp adapter abstraction (pluggable for real API later)
- Mock provider for local development (no real API calls)
- Inbound webhook handling for guest confirmations
- Message event logging for audit trail
- State transitions: WAITING → CALLED → CONFIRMED
- Expiry logic for both confirm + arrival windows

## Known Gaps (for Phase 3)
- Real WhatsApp API integration (needs credentials)
- Webhook signature validation (Meta HMAC-SHA256) — currently loose for mock
- No rate limiting on join/webhook
- No confirm timeout message (when guest doesn't reply)
- No ETA calculation yet (Phase 4)

## Next: Phase 3
- Confirm timeout handler (if guest doesn't confirm within 120s)
- Arrival timeout handler (if guest doesn't arrive within 300s after confirm)
- Seat / skip / cancel complete + state cleanup
