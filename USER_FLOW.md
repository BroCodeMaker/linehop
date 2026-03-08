# WAITLIST - User Flows (v1)

MVP: WhatsApp-only notifications/confirmation.

## 1) Guest flow - Join waitlist
1. Guest scans QR at entrance (or sees short URL).
2. Join page shows:
   - Party size (1-12)
   - Phone number (E.164)
   - Optional name
   - Note: "You need WhatsApp on this phone to receive confirmation."
3. Guest submits.
4. Guest sees Status page:
   - Position in queue
   - Estimated wait (simple estimate: avg time per party * positions ahead; can be naive in MVP)
   - Current state (WAITING/CALLED/CONFIRMED/etc.)

## 2) Guest flow - Table ready (WhatsApp)
1. Host clicks CALL NEXT.
2. Guest receives WhatsApp message:
   - "Your table is ready. Reply 1 within 2 minutes to confirm."
3. If guest replies in time:
   - State becomes CONFIRMED
   - Guest receives: "Confirmed. Please arrive within 5 minutes."
4. If not:
   - State becomes EXPIRED
   - Guest receives (optional): "Time expired. Please re-join."

## 3) Restaurant flow - Dashboard
Dashboard shows list rows with:
- Status badge
- Party size
- Phone (masked last 3-4 digits)
- Waiting time
- Actions depending on status:
  - WAITING: (no per-row action needed)
  - CALLED: Seat, Skip, Cancel
  - CONFIRMED: Seat, Cancel
  - Others: archive view

Primary buttons:
- CALL NEXT
- ADD GROUP (manual add if guest has no phone/WhatsApp; MVP can allow but mark as "no-notify")
- SETTINGS (restaurant data, QR download)

## 4) Edge cases (define behavior now)
- Guest has no WhatsApp:
  - MVP: block join (or allow join but warn "no notifications"). Recommended: block join unless manual add by host.
- Multiple assignees / duplicates:
  - If same phone joins multiple times: allow, but show warning and keep newest active, auto-cancel old (optional). MVP simplest: allow, but host sees duplicates.
- Host calls next but guest confirms late:
  - Treat as expired and do not confirm entry.
- Host seats without confirm:
  - Allow override: host can seat any entry.

## 5) Copy text (MVP)
Join page:
- "Join the waitlist"
- "This MVP uses WhatsApp for notifications. Please use a phone with WhatsApp."

WhatsApp message:
- "Your table is ready at {restaurant_name}. Reply 1 within 2 minutes to confirm."

Confirmed message:
- "Confirmed. Please arrive within 5 minutes."

Expired message:
- "Time expired. Please re-join the waitlist."

