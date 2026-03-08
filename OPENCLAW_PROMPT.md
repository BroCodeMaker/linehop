# OpenClaw Prompt - WAITLIST (v1)

You are building a QR-based restaurant waitlist system called WAITLIST.
MVP: WhatsApp-only notifications and confirmations (no SMS in MVP).
Keep code structured so SMS fallback can be added later with minimal changes.

## Goal
Deliver a working MVP that a single restaurant can use:
- Guests join via QR on mobile web
- Staff uses a simple dashboard to call next / seat / skip
- When staff calls next, system sends WhatsApp message
- Guest must confirm in 2 minutes
- After confirm, guest must arrive in 5 minutes
- System auto-expires entries when time windows pass
- Basic analytics endpoints (avg wait, no-show rate) are optional in MVP but data must be stored

## Hard constraints
- MVP uses WhatsApp only (explicit requirement).
- No complex table-size matching in MVP.
- Few clicks for staff. One primary action: CALL NEXT.
- Store timestamps: created_at, called_at, confirmed_at, seated_at, expired_at.
- State machine must be explicit and enforced server-side.

## Suggested stack (choose something consistent and simple)
Option A (recommended):
- Next.js (App Router) + API routes
- PostgreSQL + Prisma
- Auth: simple email+password for restaurant staff (bcrypt)
- WhatsApp integration: provider webhook + send API (implement via generic adapter; provider keys in env)

If you choose another stack, keep the same endpoints and DB semantics.

## Pages (UI)
Guest:
- /r/[slug] join page (party_size, phone, optional name)
- /s/[public_token] status page (position, eta, status)

Staff:
- /app/login
- /app/[restaurantId]/dashboard
  - queue list
  - buttons: CALL NEXT, ADD GROUP, SEATED, SKIP

## API endpoints (minimum)
Public:
- POST /api/public/restaurants/{slug}/join
  body: { partySize, phoneE164, guestName? }
  returns: { publicToken, statusUrl }
- GET /api/public/entry/{publicToken}
  returns: { status, position, etaMinutes, partySize }

Staff (auth):
- GET  /api/restaurants/{id}/queue
- POST /api/restaurants/{id}/call-next
- POST /api/restaurants/{id}/entries/{entryId}/seat
- POST /api/restaurants/{id}/entries/{entryId}/skip
- POST /api/restaurants/{id}/entries/{entryId}/cancel (optional)

Messaging:
- POST /api/webhooks/whatsapp
  - validate provider signature if available
  - parse inbound messages: treat "1" or "CONFIRM" as confirm action

## Queue logic
- WAITING entries are ordered by created_at (FIFO).
- call-next selects first WAITING entry and transitions it to CALLED:
  - called_at = now
  - confirm_deadline_at = now + 2 minutes
- confirm within deadline transitions to CONFIRMED:
  - confirmed_at = now
  - arrival_deadline_at = now + 5 minutes
- background job runs every 30-60 seconds:
  - CALLED past confirm_deadline_at => EXPIRED (expired_at)
  - CONFIRMED past arrival_deadline_at => EXPIRED (expired_at)

## WhatsApp message templates
TABLE_READY:
- "Your table is ready at {restaurantName}. Reply 1 within 2 minutes to confirm."

CONFIRMED:
- "Confirmed. Please arrive within 5 minutes."

EXPIRED:
- "Time expired. Please re-join the waitlist."

## Data model
Use these tables (or equivalent):
- restaurants
- restaurant_users
- waitlist_entries
- notifications
- message_events

## Deliverables
1) A runnable repo with:
- migrations / schema
- env example
- scripts to run locally
2) Clean README:
- how to create a restaurant
- how to generate QR
- how to test WhatsApp flow (webhook simulation acceptable)
3) Minimal, working UI with no clutter.

## Quality bar
- Deterministic state transitions
- Clear errors and validation (phone, party size)
- Rate limiting on join endpoint
- Logging of webhook events and outbound sends

Start by scaffolding the repo, then implement DB schema, then public join, then staff dashboard, then WhatsApp send/webhook, then background expiration.

