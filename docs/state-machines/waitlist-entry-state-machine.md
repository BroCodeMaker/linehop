# WaitlistEntry State Machine — LineHop (Restaurant Waitlist)

## ASCII State Diagram

```
                          joinQueue()
                               │
                               ▼
                        ┌─────────────┐
                        │   WAITING   │
                        └──────┬──────┘
                               │
              ┌────────────────┤ callNext() / callEntry()
              │                │
              │         ┌──────▼──────┐
              │         │   CALLED    │
              │         └──────┬──────┘
              │                │
              │         ┌──────┴────────────────────┐
              │         │                           │
              │    confirmEntry()            timer (confirmTimerSec)
              │    (guest confirms)                 │
              │         │                    ┌──────▼──────────┐
              │  ┌──────▼──────┐             │ NO_SHOW_CONFIRM  │ ←── CALLED not confirmed in time
              │  │  CONFIRMED  │             └─────────────────┘
              │  └──────┬──────┘
              │         │
              │  ┌──────┴────────────────────┐
              │  │                           │
              │ seatEntry()          timer (arrivalTimerSec)
              │ (operator)                   │
              │  │                    ┌──────▼──────────┐
              │  │                    │ NO_SHOW_ARRIVAL  │ ←── CONFIRMED didn't arrive in time
              │  │                    └─────────────────┘
              │  │
              │  ▼
              │ ┌────────┐
              │ │ SEATED │
              │ └────────┘
              │
              │
              │ skipEntry() — from WAITING, CALLED, CONFIRMED
              ▼
        ┌─────────┐
        │ SKIPPED │
        └─────────┘

        cancelEntry() — from WAITING, CALLED, CONFIRMED
        closeRestaurant() — from WAITING, CALLED, CONFIRMED
              │
              ▼
        ┌──────────┐
        │ CANCELED │
        └──────────┘
```

---

## Transition Table

| From             | To                | Trigger                 | Who       | Conditions                              | Side Effects                                                         |
|------------------|-------------------|-------------------------|-----------|------------------------------------------|----------------------------------------------------------------------|
| WAITING          | CALLED            | `callNext()`            | Operator  | Oldest WAITING entry                     | Sets `calledAt`, `confirmDeadlineAt`; WhatsApp call msg + 60s reminder timer |
| WAITING          | CALLED            | `callEntry(id)`         | Operator  | Entry must be WAITING                    | Same as callNext()                                                   |
| CALLED           | CONFIRMED         | `confirmEntry()`        | Guest     | Entry must be CALLED; atomic updateMany  | Sets `confirmedAt`, `arrivalDeadlineAt`; clears reminder timer      |
| CALLED           | NO_SHOW_CONFIRM   | timer auto-fires        | System    | `confirmDeadlineAt` elapsed (default 2m) | Sets `expiredAt`, `expiredReason`; WhatsApp expire msg; emitUpdate  |
| CALLED           | CALLED (retry)    | `callAgain()`           | Operator  | `callAgainCount < maxCallAgain`          | Increments `callAgainCount`; new `confirmDeadlineAt`; WhatsApp callAgain msg |
| CONFIRMED        | SEATED            | `seatEntry()`           | Operator  | Entry must be CONFIRMED (or WAITING/CALLED) | Sets `seatedAt`; clears reminder timer; emitUpdate               |
| CONFIRMED        | NO_SHOW_ARRIVAL   | timer auto-fires        | System    | `arrivalDeadlineAt` elapsed (default 5m) | Sets `expiredAt`, `expiredReason`; WhatsApp expire msg; emitUpdate  |
| WAITING/CALLED/CONFIRMED | SKIPPED  | `skipEntry()`           | Operator  | Any active state                         | Sets `skippedAt`; clears timer; emitUpdate                          |
| WAITING/CALLED/CONFIRMED | CANCELED | `cancelEntry()`         | Guest/Op  | Any active state                         | Sets `canceledAt`; clears timer; emitUpdate                         |
| WAITING/CALLED/CONFIRMED | CANCELED | `closeRestaurant()`     | Operator  | Bulk cancel all active                   | Sets restaurant.status=CLOSED; WhatsApp per guest; auditLog; emitUpdate |

---

## Use Case Scenarios

### Happy Path
```
1. Guest registers at /r/[slug] (partySize, phone, guestName)
2. WaitlistEntry created, status=WAITING
3. Operator sees queue, clicks "Call Next"
4. Entry status=CALLED; WhatsApp: "Vă rugăm să vă prezentați în 2 minute"
5. 60s later: reminder WhatsApp sent
6. Guest clicks confirm on /s/[publicToken] → status=CONFIRMED
7. 5min arrivalTimerSec starts
8. Guest arrives; operator clicks "Seat" → status=SEATED
```

### No-Show (confirm not clicked)
```
1. Entry is CALLED at 20:00:00
2. confirmDeadlineAt = 20:02:00 (default 2 min)
3. Guest does not confirm
4. Expiry job fires → status=NO_SHOW_CONFIRM
5. WhatsApp: "Din păcate locul dumneavoastră a expirat."
6. Entry visible in dashboard for bufferVisibilitySec (default 10 min)
```

### No-Show (confirmed but didn't arrive)
```
1. Guest confirms → status=CONFIRMED
2. arrivalDeadlineAt = confirmTime + 300s (5 min)
3. Guest does not show up at restaurant
4. Expiry job fires → status=NO_SHOW_ARRIVAL
5. WhatsApp expiry notification sent
```

### Call Again
```
1. Entry is NO_SHOW_CONFIRM (or operator wants retry)
2. Operator clicks "Call Again"
3. POST /api/restaurants/[id]/entries/[id]/call-again
4. callAgainCount incremented (max: maxCallAgain, default 1)
5. Entry back to CALLED with fresh confirmDeadlineAt
6. WhatsApp: "Vă mai acordăm o șansă, vă rugăm să vă prezentați."
```

### Restaurant Close
```
1. Operator clicks "Close Restaurant"
2. closeRestaurant() runs:
   a. Fetches all WAITING + CALLED + CONFIRMED entries
   b. Sets restaurant.status = CLOSED
   c. Bulk cancels all entries
   d. WhatsApp notification per guest: "Restaurantul s-a închis..."
   e. auditLog written for each canceled entry + one for the close event
```

---

## WhatsApp Notifications Per Transition

| Transition              | Template field      | Example message                                                 |
|-------------------------|---------------------|-----------------------------------------------------------------|
| WAITING → CALLED        | msgWhatsappCall     | "Vă rugăm să vă prezentați la intrare în 2 minute."            |
| 60s after CALLED        | (hardcoded reminder)| "⏰ Reminder: Mai aveți 1 minut să confirmați! ✅ / ❌"         |
| CALLED → CALLED (again) | msgWhatsappCallAgain| "Vă mai acordăm o șansă, vă rugăm să vă prezentați."           |
| CALLED → NO_SHOW_CONFIRM| msgWhatsappExpire   | "Din păcate locul dumneavoastră a expirat."                    |
| CONFIRMED → NO_SHOW_ARRIVAL | msgWhatsappExpire | "Din păcate locul dumneavoastră a expirat."                  |
| * → CANCELED (close)    | (hardcoded)         | "Ne pare rău, [name]! Restaurantul s-a închis..."              |

---

## Key Differences vs LineHop Ticket

| Aspect               | WaitlistEntry (Restaurant) | Ticket (Generic Queue)             |
|----------------------|----------------------------|------------------------------------|
| Confirm step         | Yes (CALLED → CONFIRMED)   | No                                 |
| Arrival timer        | Yes (CONFIRMED → NO_SHOW_ARRIVAL) | No                          |
| Party size           | Yes (partySize field)      | No                                 |
| Phone required       | Yes (phoneE164 required)   | Optional                           |
| Call again           | Yes (max 1 retry)          | No                                 |
| Terminal states      | SEATED, SKIPPED, CANCELED, NO_SHOW_* | DONE, NO_SHOW, CANCELED  |
| Auto-call next       | On expiry if FULL status   | No (operator-driven)               |
