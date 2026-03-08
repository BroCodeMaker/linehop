# Phase 3 Product Output — Time Windows & Operations
Date: 2026-03-08

## User Experience Review

### Guest Journey (New in Phase 3)
1. **Join** → party size, phone, name
2. **Status page** → shows position in queue, auto-refreshes
3. **Called** → receives WhatsApp notification (mock for now)
4. **Confirm or Cancel** → button on status page
5. **Seated** → celebration message, enjoy meal
6. **Timeout handling** → expired state shown, guest can't recover

### Host Journey (New in Phase 3)
1. **Dashboard** → live queue
2. **Call next** → guest called, confirm window opens
3. **Seat/Skip** → when guest ready
4. **Skip auto-calls** next guest (smooth workflow)

## State Visibility
All states now visible to guest:
- ⏳ WAITING — position in queue
- 📲 CALLED — "Your table is ready! Confirm in 2 minutes."
- ✅ CONFIRMED — "Confirmed! Please arrive soon."
- 🪑 SEATED — "Enjoy your meal!"
- ⌛ EXPIRED — "Your confirmation window expired"
- ❌ CANCELED — "Booking canceled"

## Key Improvements
- **Cancel anytime** (before seated/expired)
- **Clear timeouts** visible in UI
- **Auto-call on skip** (no manual step)
- **Proper error states** (expired guests can see why)

## Gaps for Phase 4
- No recovery after timeout (design choice: expired = final)
- No recovery after skip
- Dashboard has no auth (acceptable for Phase 3 MVP)
- No SMS fallback (WhatsApp only per requirements)

## Phase 3 MVP Complete
✅ Guests can join, confirm, be seated
✅ Hosts can call, skip, seat
✅ Timeouts enforced
✅ Clear state visibility
✅ Cancel anytime

Product: APPROVED for Phase 3
