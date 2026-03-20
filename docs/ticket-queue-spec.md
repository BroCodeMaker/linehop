# LineHop Ticket — Product Specification

## Product Overview

LineHop Ticket is a **generic queue management system** for any business that needs to issue numbered tickets to customers. Unlike the existing LineHop waitlist product (designed for restaurants with party-based groups and arrival confirmation), LineHop Ticket is simpler:

- Customers take a number
- An operator calls the number
- The person shows up (DONE) or doesn't (NO_SHOW)

**Target use cases:** pharmacies, banks, government offices, auto service shops, clinics, butcher counters, etc.

---

## State Machine

```
                    ┌─────────────────────────────────┐
                    │                                 │
             ┌──────▼──────┐                         │
             │   WAITING   │◄── issueTicket()         │
             └──────┬──────┘                         │
                    │                                 │
         callNext() │ callTicket()                    │ cancelTicket()
                    │                                 │ (person cancels,
             ┌──────▼──────┐                         │  queue closed)
             │   CALLED    │─────────────────────────►│
             └──────┬──────┘                         │
                    │                              ┌──▼──────┐
              ┌─────┴────┐                        │ CANCELED │
              │          │                        └──────────┘
         markDone()  markNoShow()
          (operator)  (timer / operator)
              │          │
        ┌─────▼──┐  ┌────▼────┐
        │  DONE  │  │ NO_SHOW │
        └────────┘  └─────────┘
```

### State Descriptions

| State    | Meaning                                        |
|----------|------------------------------------------------|
| WAITING  | Ticket issued, person is waiting in queue      |
| CALLED   | Operator has called this ticket number         |
| DONE     | Person was served by the operator              |
| NO_SHOW  | Person did not appear after being called       |
| CANCELED | Person canceled or queue was closed            |

### Valid Transitions

| From     | To       | Trigger                              | Side Effects                          |
|----------|----------|--------------------------------------|---------------------------------------|
| WAITING  | CALLED   | callNext() / callTicket()            | Sets noShowDeadlineAt, WhatsApp notif, schedules no-show timer |
| CALLED   | DONE     | markDone()                           | Clears reminder timer, emits SSE      |
| CALLED   | NO_SHOW  | markNoShow() / timer auto-fires      | Clears timer, WhatsApp notif, SSE     |
| WAITING  | CANCELED | cancelTicket() / closeQueue()        | Clears timer (if any), SSE            |
| CALLED   | CANCELED | closeQueue()                         | Clears timer, WhatsApp notif, SSE     |

---

## Feature List

### Core Features
- [IMPLEMENTED] Issue numbered tickets (sequential per queue, daily reset optional)
- [IMPLEMENTED] Call next ticket (oldest WAITING)
- [IMPLEMENTED] Call specific ticket by ID
- [IMPLEMENTED] Mark ticket as DONE
- [IMPLEMENTED] Mark ticket as NO_SHOW (operator action)
- [IMPLEMENTED] Auto no-show timer (configurable, default 3 min after CALLED)
- [IMPLEMENTED] Cancel individual ticket
- [IMPLEMENTED] Cancel ticket as queue guest (client self-cancel via UI)
- [IMPLEMENTED] Close queue (cancels all active, sends WhatsApp)
- [IMPLEMENTED] OPEN / PAUSE / CLOSE queue status
- [IMPLEMENTED] WhatsApp notification on CALLED
- [IMPLEMENTED] WhatsApp notification on NO_SHOW
- [IMPLEMENTED] WhatsApp notification on queue CLOSE
- [IMPLEMENTED] SSE real-time updates (operator dashboard + display + client page)
- [IMPLEMENTED] Public ticket status page (`/t/[publicToken]`)
- [IMPLEMENTED] Operator dashboard (`/ticket/[queueId]/operator`)
- [IMPLEMENTED] Public display screen (`/ticket/[queueId]/display`)
- [IMPLEMENTED] Self-service ticket issuance (`/ticket/new?queue=SLUG`)

### Not Implemented (Future)
- [NOT IMPLEMENTED] Operator authentication (currently open)
- [NOT IMPLEMENTED] Queue creation UI (currently API-only)
- [NOT IMPLEMENTED] Per-queue settings UI (noShowTimerSec, messages)
- [NOT IMPLEMENTED] Analytics / served count per day
- [NOT IMPLEMENTED] Multi-window support (multiple operators calling simultaneously)
- [NOT IMPLEMENTED] Estimated wait time (algorithm based on serve rate)
- [NOT IMPLEMENTED] QR code for queue joining
- [NOT IMPLEMENTED] SMS provider support (currently WhatsApp or mock)

### Future Roadmap
- [FUTURE] User account linking (ownerId field reserved)
- [FUTURE] Webhook callbacks on state changes
- [FUTURE] API key authentication per queue
- [FUTURE] Custom message templates per queue
- [FUTURE] Priority tickets (skip-the-line)
- [FUTURE] Category routing (e.g. "Counter A" vs "Counter B")
- [FUTURE] Kiosk mode with receipt printer integration

---

## API Reference

All endpoints are under `/api/ticket/`.

### Queue Management

#### `POST /api/ticket/queues`
Create a new queue. No auth required (future: API key).

**Body:**
```json
{
  "name": "Pharmacy Counter",
  "slug": "pharmacy-main",
  "businessType": "pharmacy",
  "timezone": "Europe/Bucharest"
}
```

**Response:** `201 Created` — full queue object with settings

---

#### `GET /api/ticket/[queueId]`
Get queue info and current stats.

**Response:**
```json
{
  "id": "uuid",
  "name": "Pharmacy Counter",
  "status": "OPEN",
  "stats": {
    "waitingCount": 5,
    "calledTicket": { "id": "...", "number": 42, ... } | null
  }
}
```

---

#### `GET /api/ticket/by-slug/[slug]`
Look up queue by slug. Returns same shape as `GET /api/ticket/[queueId]`.

---

#### `PUT /api/ticket/[queueId]/status`
Change queue status.

**Body:** `{ "status": "OPEN" | "PAUSED" | "CLOSED" }`

CLOSED triggers `closeQueue()` which cancels all active tickets.

---

### Ticket Operations

#### `POST /api/ticket/[queueId]/issue`
Issue a new ticket. Public endpoint (no auth).

**Body:**
```json
{
  "guestName": "John Doe",
  "phoneE164": "+40712345678"
}
```
Both fields optional. Returns `201` with ticket object including `publicToken`.

---

#### `POST /api/ticket/[queueId]/call-next`
Call the oldest WAITING ticket. Operator endpoint.

**Response:** The called ticket, or `404` if no waiting tickets.

---

#### `GET /api/ticket/[queueId]/tickets`
List active tickets (WAITING + recently CALLED/DONE/NO_SHOW within 30 min).

---

#### `POST /api/ticket/[queueId]/tickets/[ticketId]/done`
Mark a CALLED ticket as DONE.

#### `POST /api/ticket/[queueId]/tickets/[ticketId]/no-show`
Mark a CALLED ticket as NO_SHOW.

#### `POST /api/ticket/[queueId]/tickets/[ticketId]/cancel`
Cancel a WAITING or CALLED ticket.

---

### Public Endpoints

#### `GET /api/public/ticket/[publicToken]`
Get public ticket status. No auth. Returns ticket + queue info + `position` (1-based position in WAITING queue, null if not WAITING).

---

### SSE Stream

#### `GET /api/ticket/[queueId]/stream`
Server-Sent Events stream. Emits:
- `connected` — initial connection confirmation
- `update` — fired on any state change in the queue
- `ping` — heartbeat every 30 seconds

---

## Database Schema Summary

### TicketQueue
| Field        | Type     | Notes                                   |
|--------------|----------|-----------------------------------------|
| id           | UUID     | Primary key                             |
| name         | String   | Display name                            |
| slug         | String   | URL-friendly unique identifier          |
| businessType | String   | pharmacy/bank/service/generic           |
| status       | String   | OPEN/PAUSED/CLOSED                      |
| timezone     | String   | IANA timezone (default: Europe/Bucharest)|
| ownerId      | String?  | Reserved for future user account linking|

### TicketQueueSettings
| Field            | Type    | Default | Notes                              |
|------------------|---------|---------|------------------------------------|
| noShowTimerSec   | Int     | 180     | Seconds until auto NO_SHOW after CALLED |
| dailyReset       | Boolean | true    | Reset ticket counter each day      |
| msgWhatsappCall  | String  | —       | Message template, use {number}     |
| msgWhatsappNoShow| String  | —       | Message template, use {number}     |
| msgWhatsappClosed| String  | —       | Message template, use {number}     |

### Ticket
| Field           | Type      | Notes                                    |
|-----------------|-----------|------------------------------------------|
| id              | UUID      | Primary key                              |
| queueId         | UUID      | FK to TicketQueue                        |
| number          | Int       | Sequential (resets daily if configured) |
| publicToken     | UUID      | Public-facing opaque identifier         |
| phoneE164       | String?   | For WhatsApp notifications              |
| guestName       | String?   | Optional display name                   |
| status          | String    | WAITING/CALLED/DONE/NO_SHOW/CANCELED    |
| noShowDeadlineAt| DateTime? | Set when CALLED; auto-fires timer       |

### TicketMessageEvent
Audit log of all outbound WhatsApp messages per ticket.

---

## Known Limitations

1. **No operator authentication** — the operator dashboard is publicly accessible by queueId. Anyone with the URL can call tickets. Future: operator tokens or session-based auth.

2. **In-memory timers** — no-show timers use `setTimeout` stored in Node.js memory. On serverless deployments (Vercel), cold starts will lose pending timers. Future: use a persistent job queue (e.g., pg-boss, Redis, Vercel Cron).

3. **No rate limiting** — the issue endpoint is open and could be spammed. Future: IP-based rate limiting.

4. **Single active call** — the system assumes one ticket is CALLED at a time. Multiple simultaneous CALLED tickets are technically possible via the API but the operator UI shows only the most recent. Future: multi-window support.

5. **No daily reset automation** — `dailyReset` only affects the ticket number counter in `issueTicket`. Old tickets from yesterday are not automatically cleaned up. Future: a cron job to archive old tickets.
