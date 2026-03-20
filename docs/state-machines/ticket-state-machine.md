# Ticket State Machine — LineHop Ticket

## ASCII State Diagram

```
                          issueTicket()
                               │
                               ▼
                        ┌─────────────┐
                        │   WAITING   │
                        └──────┬──────┘
                               │
              ┌────────────────┤ callNext() / callTicket()
              │                │
              │         ┌──────▼──────┐
              │         │   CALLED    │
              │         └──────┬──────┘
              │                │
              │         ┌──────┴──────┐
              │         │             │
              │    markDone()   markNoShow()
              │    (operator)   (timer / operator)
              │         │             │
              │    ┌────▼───┐   ┌─────▼────┐
              │    │  DONE  │   │ NO_SHOW  │
              │    └────────┘   └──────────┘
              │
              │ cancelTicket() — from WAITING or CALLED
              │ closeQueue()   — from WAITING or CALLED
              ▼
        ┌──────────┐
        │ CANCELED │
        └──────────┘
```

---

## Transition Table

| From     | To       | Trigger Function      | Who       | Conditions                              | Side Effects                                                  |
|----------|----------|-----------------------|-----------|------------------------------------------|---------------------------------------------------------------|
| WAITING  | CALLED   | `callNext()`          | Operator  | Queue has at least 1 WAITING ticket      | Sets `calledAt`, `noShowDeadlineAt`; WhatsApp if phone; schedules no-show timer; emitUpdate |
| WAITING  | CALLED   | `callTicket(id)`      | Operator  | Specific ticket must be WAITING          | Same as callNext()                                            |
| CALLED   | DONE     | `markDone()`          | Operator  | Ticket must be CALLED                    | Sets `doneAt`; clears reminder timer; emitUpdate              |
| CALLED   | NO_SHOW  | `markNoShow()`        | Operator  | Ticket must be CALLED                    | Sets `noShowAt`; clears timer; WhatsApp notif if phone; emitUpdate |
| CALLED   | NO_SHOW  | timer auto-fires      | System    | `noShowDeadlineAt` elapsed               | Same as operator markNoShow()                                 |
| WAITING  | CANCELED | `cancelTicket()`      | Guest/Op  | Ticket must be WAITING or CALLED         | Sets `canceledAt`; emitUpdate                                 |
| CALLED   | CANCELED | `cancelTicket()`      | Operator  | Ticket must be WAITING or CALLED         | Sets `canceledAt`; clears timer; emitUpdate                   |
| WAITING  | CANCELED | `closeQueue()`        | Operator  | Bulk cancel all active tickets           | Sets `canceledAt`; WhatsApp notif if phone; emitUpdate        |
| CALLED   | CANCELED | `closeQueue()`        | Operator  | Bulk cancel all active tickets           | Sets `canceledAt`; clears timer; WhatsApp notif if phone; emitUpdate |

---

## Use Case Scenarios

### Happy Path (customer served)
```
1. Customer arrives → GET /ticket/new?queue=pharmacy → fills form
2. POST /api/ticket/[queueId]/issue → Ticket #007 issued, status=WAITING
3. Customer sees /t/[publicToken] showing "Position #3"
4. Operator clicks "Call Next" → #007 status=CALLED
5. WhatsApp sent: "Este rândul dvs.! Numărul 7."
6. Customer walks up → Operator clicks "Done" → #007 status=DONE
```

### No-Show (auto timer)
```
1. Ticket #012 is CALLED at 14:30:00
2. noShowDeadlineAt = 14:33:00 (3 min default)
3. Customer does not appear
4. Timer fires at 14:33:00 → markNoShow() called
5. #012 status=NO_SHOW
6. WhatsApp sent: "Numărul dvs. 12 a expirat. Ne pare rău."
```

### No-Show (operator manual)
```
1. Ticket #015 is CALLED
2. Operator observes no-show → clicks "No-Show" button
3. POST /api/ticket/[queueId]/tickets/[id]/no-show
4. #015 status=NO_SHOW
5. WhatsApp notification sent
```

### Guest Self-Cancel
```
1. Ticket #003 is WAITING
2. Customer decides not to wait → clicks "Cancel my ticket" on /t/[token]
3. POST /api/ticket/[queueId]/tickets/[id]/cancel
4. #003 status=CANCELED
```

### Queue Close
```
1. Operator clicks "CLOSED" on operator dashboard
2. Confirmation dialog shown
3. PUT /api/ticket/[queueId]/status { status: "CLOSED" }
4. closeQueue() runs:
   a. Fetches all WAITING + CALLED tickets
   b. Sets queue.status = CLOSED
   c. Sets all active tickets to CANCELED
   d. Sends WhatsApp to each guest with phone
5. SSE update fires → all connected clients refresh
6. Display screen shows "Queue Closed"
```

---

## WhatsApp Notifications Per Transition

| Transition       | Condition          | Template field         | Example message                                         |
|------------------|--------------------|------------------------|---------------------------------------------------------|
| WAITING → CALLED | phone provided     | msgWhatsappCall        | "Este rândul dvs.! Numărul 7. Vă rugăm să vă prezentați.\n\nhttps://linehop.app/t/[token]" |
| CALLED → NO_SHOW | phone provided     | msgWhatsappNoShow      | "Numărul dvs. 7 a expirat. Ne pare rău."               |
| * → CANCELED     | via closeQueue()   | msgWhatsappClosed      | "Coada s-a închis. Numărul dvs. 7 a fost anulat."      |

Template variable: `{number}` is replaced with the ticket number.
