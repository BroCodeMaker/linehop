# WAITLIST - System Architecture (v1)

Scope: QR-based restaurant waitlist with WhatsApp notifications. MVP is WhatsApp-only.
Design keeps a clean path for later SMS fallback without rewrites.

## 1) Actors
- Guest (mobile web)
- Host/Hostess (restaurant dashboard)
- System (API + DB + notifier)
- WhatsApp Provider (send message, receive webhook)

## 2) High-level components
1. Web Client
   - Guest join page (QR -> mobile web)
   - Guest status page (position, ETA, state)
   - Restaurant dashboard (queue control)

2. Backend API
   - Auth (restaurant users)
   - Waitlist service (queue logic, state machine)
   - Notification service (WhatsApp send, webhook receive)
   - Analytics service (wait times, no-show, peaks)

3. Database (Postgres recommended)
   - Core tables: restaurants, restaurant_users, waitlist_entries, notifications, message_events

4. Messaging Integration (WhatsApp)
   - Outbound: send "Your table is ready. Confirm in 2 minutes."
   - Inbound: webhook for "CONFIRM" or button click response
   - Delivery receipts (optional but useful)

## 3) Core domain model
### WaitlistEntry states (simple, explicit)
- WAITING (in queue)
- CALLED (notified, pending confirm)
- CONFIRMED (guest confirmed)
- SEATED (done)
- SKIPPED (host skipped)
- EXPIRED (no confirm in time)
- CANCELED (guest canceled)

Rules:
- CALL NEXT moves top WAITING -> CALLED and starts a confirm timer (2 minutes).
- If guest confirms within confirm window => CONFIRMED and starts arrival timer (5 minutes).
- If arrival expires => EXPIRED (or optionally back to WAITING, but keep MVP simple: EXPIRED).
- Host can override: SEATED, SKIPPED, CANCELED at any time.

## 4) Key flows
### Guest join
QR -> /r/{slug}
- Inputs: party_size, phone (E.164), optional name
- Creates WAITING entry
- Returns status page URL (unique token) for polling / live updates

### Call next (restaurant dashboard)
- Host clicks CALL NEXT
- Backend picks next eligible WAITING entry (FIFO, optional party_size matching later)
- Updates entry to CALLED, sets called_at, confirm_deadline_at
- Sends WhatsApp message
- Creates notification record

### Guest confirm
- Guest replies "1" / "CONFIRM" (or button) on WhatsApp
- WhatsApp webhook hits backend
- Backend matches message to waitlist entry
- If within confirm window: set CONFIRMED, confirmed_at, arrival_deadline_at
- If too late: ignore or reply "Expired"

### Seat / Skip
- SEATED: sets seated_at, status SEATED
- SKIP: sets status SKIPPED and immediately calls next candidate (optional in UI)

## 5) APIs (suggested minimal)
Public:
- POST /api/public/restaurants/{slug}/join
- GET  /api/public/entry/{public_token}
- POST /api/public/entry/{public_token}/cancel (optional)

Restaurant (auth):
- GET  /api/restaurants/{id}/queue
- POST /api/restaurants/{id}/call-next
- POST /api/restaurants/{id}/entries/{entry_id}/seat
- POST /api/restaurants/{id}/entries/{entry_id}/skip
- POST /api/restaurants/{id}/entries/{entry_id}/cancel

Messaging:
- POST /api/webhooks/whatsapp (inbound messages + delivery receipts)

## 6) Timers / background jobs
MVP can implement as a lightweight cron job every 30-60 seconds:
- Expire CALLED entries past confirm_deadline_at -> EXPIRED
- Expire CONFIRMED entries past arrival_deadline_at -> EXPIRED

Later: move to a queue system (BullMQ / SQS / Cloud Tasks).

## 7) Security and abuse controls
- Rate limit join endpoint per device/IP
- Phone normalization to E.164
- Block duplicate spam joins (same phone + restaurant + short window)
- Auth: email+password or magic link for restaurant users
- Webhook signature verification from WhatsApp provider

## 8) Observability
- Log every state change with actor and timestamp
- Store inbound/outbound message events for debugging
- Metrics: avg wait, no-show rate, confirm rate, call-to-confirm time

## 9) Future SMS fallback plan (kept for later)
Introduce a single abstraction: NotificationChannel
- channel: WHATSAPP | SMS
- selection logic:
  - if WhatsApp deliverable -> WhatsApp
  - else SMS
In MVP, force WHATSAPP only and show clear UI message:
"Requires WhatsApp for confirmation."

