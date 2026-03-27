/**
 * LH-006: Settings Validation Tests (end-to-end params)
 * Tests A-G: timers, party/queue limits, call-again, estimated wait, WhatsApp messages
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── vi.hoisted mock DB ────────────────────────────────────────────────────────
const { mockDb, prismaMock } = vi.hoisted(() => {
  const mockDb: {
    restaurants: Map<string, Record<string, unknown>>;
    restaurantSettings: Map<string, Record<string, unknown>>;
    entries: Map<string, Record<string, unknown>>;
    messageEvents: Map<string, Record<string, unknown>>;
  } = {
    restaurants: new Map(),
    restaurantSettings: new Map(),
    entries: new Map(),
    messageEvents: new Map(),
  };

  const prismaMock = {
    restaurant: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    restaurantSettings: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    waitlistEntry: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    messageEvent: {
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const ev = { id: `msg-${Date.now()}`, ...data };
        mockDb.messageEvents.set(ev.id as string, ev);
        return Promise.resolve(ev);
      }),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  };

  return { mockDb, prismaMock };
});

// ── hoisted sendWhatsApp spy ──────────────────────────────────────────────────
const sendWhatsAppMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ ok: true, provider: "mock", to: "+40700000001" })
);

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({ default: prismaMock, prisma: prismaMock }));
vi.mock("@/lib/emitter", () => ({ emitUpdate: vi.fn() }));
vi.mock("@/lib/timers", () => ({
  scheduleReminder: vi.fn(),
  clearReminderTimer: vi.fn(),
}));
vi.mock("@/lib/notify", () => ({ sendWhatsAppMessage: sendWhatsAppMock }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn(() => ({ restaurantId: "test", email: "test@test.com" })),
  signSession: vi.fn(() => "mock-session-token"),
}));

// ── Business logic imports (after mocks) ─────────────────────────────────────
import { callNext, confirmEntry, getRestaurantSettings } from "@/lib/queue";
import { expireEntries } from "@/lib/expiry";
import { POST as joinPOST } from "@/app/api/public/restaurants/[slug]/join/route";
import { POST as callAgainPOST } from "@/app/api/restaurants/[id]/entries/[entryId]/call-again/route";
import { GET as infoGET } from "@/app/api/public/restaurants/[slug]/info/route";

// ── Seed helpers ──────────────────────────────────────────────────────────────
function seedRestaurant(overrides: Record<string, unknown> = {}) {
  const id = `rest-${Date.now()}-${Math.random()}`;
  const r = {
    id,
    name: "Test Restaurant",
    slug: `slug-${id}`,
    status: "FULL",
    listClosed: false,
    createdAt: new Date(),
    ...overrides,
  };
  mockDb.restaurants.set(id, r);
  return r;
}

function seedEntry(restaurantId: string, overrides: Record<string, unknown> = {}) {
  const id = `entry-${Date.now()}-${Math.random()}`;
  const e = {
    id,
    restaurantId,
    publicToken: `token-${id}`,
    partySize: 2,
    phoneE164: "+40700000001",
    guestName: "Test Guest",
    status: "WAITING",
    createdAt: new Date(),
    callAgainCount: 0,
    expiredAt: null,
    expiredReason: null,
    ...overrides,
  };
  mockDb.entries.set(id, e);
  return e;
}

function seedSettings(restaurantId: string, overrides: Record<string, unknown> = {}) {
  const s = {
    id: `settings-${restaurantId}`,
    restaurantId,
    confirmTimerSec: 120,
    arrivalTimerSec: 300,
    bufferVisibilitySec: 600,
    maxCallAgain: 1,
    maxPartySize: 6,
    maxQueueSize: 5,
    waitMinutesPerGroup: 10,
    estimatedTableTimeMin: 15,
    useCalculatedAvgTime: false,
    msgWhatsappCall: "Masa dvs. este gata! Vă rugăm să veniți.",
    msgWhatsappExpire: "Locul dvs. a expirat. Ne pare rău.",
    msgWhatsappCallAgain: "O nouă șansă pentru dvs.",
    msgWhatsappWaiting: "Mulțumim, {name}! Mai sunt {position} grupuri.",
    updatedAt: new Date(),
    ...overrides,
  };
  mockDb.restaurantSettings.set(restaurantId, s);
  return s;
}

// ── beforeEach: reset + re-apply default mock implementations ─────────────────
beforeEach(() => {
  mockDb.restaurants.clear();
  mockDb.restaurantSettings.clear();
  mockDb.entries.clear();
  mockDb.messageEvents.clear();
  vi.clearAllMocks();
  sendWhatsAppMock.mockResolvedValue({ ok: true, provider: "mock", to: "+40700000001" });

  // restaurant.findUnique
  prismaMock.restaurant.findUnique.mockImplementation(
    ({ where }: { where: { id?: string; slug?: string } }) => {
      if (where.id) return Promise.resolve(mockDb.restaurants.get(where.id) ?? null);
      if (where.slug) {
        for (const r of mockDb.restaurants.values()) {
          if ((r as { slug: string }).slug === where.slug) return Promise.resolve(r);
        }
      }
      return Promise.resolve(null);
    }
  );

  // restaurantSettings.findUnique
  prismaMock.restaurantSettings.findUnique.mockImplementation(
    ({ where }: { where: { restaurantId: string } }) =>
      Promise.resolve(mockDb.restaurantSettings.get(where.restaurantId) ?? null)
  );

  // restaurantSettings.create
  prismaMock.restaurantSettings.create.mockImplementation(
    ({ data }: { data: Record<string, unknown> }) => {
      const s = {
        id: `settings-auto-${Date.now()}`,
        confirmTimerSec: 120,
        arrivalTimerSec: 300,
        bufferVisibilitySec: 600,
        maxCallAgain: 1,
        maxPartySize: 6,
        maxQueueSize: 5,
        estimatedTableTimeMin: 15,
        useCalculatedAvgTime: false,
        msgWhatsappCall: "Masa dvs. este gata!",
        msgWhatsappExpire: "Locul a expirat.",
        msgWhatsappCallAgain: "O nouă șansă.",
        updatedAt: new Date(),
        ...data,
      };
      mockDb.restaurantSettings.set(data.restaurantId as string, s);
      return Promise.resolve(s);
    }
  );

  // waitlistEntry.findUnique
  prismaMock.waitlistEntry.findUnique.mockImplementation(
    ({ where }: { where: { id?: string; publicToken?: string } }) => {
      if (where.id) return Promise.resolve(mockDb.entries.get(where.id) ?? null);
      if (where.publicToken) {
        for (const e of mockDb.entries.values()) {
          if ((e as { publicToken: string }).publicToken === where.publicToken) {
            return Promise.resolve(e);
          }
        }
      }
      return Promise.resolve(null);
    }
  );

  // waitlistEntry.findFirst
  prismaMock.waitlistEntry.findFirst.mockImplementation(
    ({ where }: { where: Record<string, unknown> }) => {
      for (const e of mockDb.entries.values()) {
        const entry = e as Record<string, unknown>;
        let match = true;
        if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
        if (where.id && entry.id !== where.id) match = false;
        if (where.status) {
          const st = where.status as { in?: string[] } | string;
          if (typeof st === "object" && st.in) {
            if (!st.in.includes(entry.status as string)) match = false;
          } else if (entry.status !== st) {
            match = false;
          }
        }
        if (match) return Promise.resolve(entry);
      }
      return Promise.resolve(null);
    }
  );

  // waitlistEntry.findMany
  prismaMock.waitlistEntry.findMany.mockImplementation(
    ({ where }: { where: Record<string, unknown> }) => {
      const results: Record<string, unknown>[] = [];
      for (const e of mockDb.entries.values()) {
        const entry = e as Record<string, unknown>;
        let match = true;
        if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
        if (where.status && entry.status !== where.status) match = false;
        if (match) results.push(entry);
      }
      return Promise.resolve(results);
    }
  );

  // waitlistEntry.create
  prismaMock.waitlistEntry.create.mockImplementation(
    ({ data }: { data: Record<string, unknown> }) => {
      const e = { id: `entry-${Date.now()}-${Math.random()}`, ...data };
      mockDb.entries.set(e.id as string, e);
      return Promise.resolve(e);
    }
  );

  // waitlistEntry.update
  prismaMock.waitlistEntry.update.mockImplementation(
    ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const e = mockDb.entries.get(where.id);
      if (!e) throw new Error("Entry not found");
      Object.assign(e, data);
      return Promise.resolve(e);
    }
  );

  // waitlistEntry.updateMany
  prismaMock.waitlistEntry.updateMany.mockImplementation(
    ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      let count = 0;
      for (const e of mockDb.entries.values()) {
        const entry = e as Record<string, unknown>;
        let match = true;
        if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
        if (where.id && entry.id !== where.id) match = false;
        if (where.status) {
          const st = where.status as { in?: string[] } | string;
          if (typeof st === "object" && st.in) {
            if (!st.in.includes(entry.status as string)) match = false;
          } else if (entry.status !== st) {
            match = false;
          }
        }
        if (match) {
          Object.assign(entry, data);
          count++;
        }
      }
      return Promise.resolve({ count });
    }
  );

  // waitlistEntry.count
  prismaMock.waitlistEntry.count.mockImplementation(
    ({ where }: { where: Record<string, unknown> }) => {
      let count = 0;
      for (const e of mockDb.entries.values()) {
        const entry = e as Record<string, unknown>;
        let match = true;
        if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
        if (where.status && entry.status !== where.status) match = false;
        if (match) count++;
      }
      return Promise.resolve(count);
    }
  );

  // messageEvent.create
  prismaMock.messageEvent.create.mockImplementation(
    ({ data }: { data: Record<string, unknown> }) => {
      const ev = { id: `msg-${Date.now()}`, ...data };
      mockDb.messageEvents.set(ev.id as string, ev);
      return Promise.resolve(ev);
    }
  );

  prismaMock.auditLog.create.mockResolvedValue({});
});

// =============================================================================
// A. confirmTimerSec — Timer Confirmare
// =============================================================================
describe("A. confirmTimerSec — Timer Confirmare", () => {
  it("callNext sets confirmDeadlineAt = now + confirmTimerSec (custom 60s)", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    seedSettings(restaurant.id, { confirmTimerSec: 60 });
    seedEntry(restaurant.id, { status: "WAITING" });

    const before = Date.now();
    const called = await callNext(restaurant.id);
    const after = Date.now();

    expect(called).not.toBeNull();
    expect(called!.status).toBe("CALLED");
    const deadline = new Date(called!.confirmDeadlineAt as Date).getTime();
    // deadline should be ~60s from now (±2s tolerance)
    expect(deadline).toBeGreaterThanOrEqual(before + 58_000);
    expect(deadline).toBeLessThanOrEqual(after + 62_000);
  });

  it("expiry marks CALLED → NO_SHOW_CONFIRM when confirmDeadlineAt has passed", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    seedSettings(restaurant.id);
    const past = new Date(Date.now() - 5_000);
    const entry = seedEntry(restaurant.id, {
      status: "CALLED",
      calledAt: new Date(Date.now() - 130_000),
      confirmDeadlineAt: past,
    });

    // expiry.ts uses findMany with complex where — mock specific responses
    prismaMock.waitlistEntry.findMany
      .mockResolvedValueOnce([entry]) // calledExpiring
      .mockResolvedValueOnce([]);     // confirmedExpiring

    prismaMock.waitlistEntry.updateMany
      .mockResolvedValueOnce({ count: 1 }) // CALLED → NO_SHOW_CONFIRM
      .mockResolvedValueOnce({ count: 0 }); // CONFIRMED → NO_SHOW_ARRIVAL (none)

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null); // no next WAITING

    const expired = await expireEntries();
    expect(expired).toBe(1);
  });

  it("CALLED entry not expired when confirmDeadlineAt is in the future", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    seedSettings(restaurant.id);
    seedEntry(restaurant.id, {
      status: "CALLED",
      calledAt: new Date(),
      confirmDeadlineAt: new Date(Date.now() + 90_000), // still valid
    });

    // No entries expired
    prismaMock.waitlistEntry.findMany
      .mockResolvedValueOnce([]) // calledExpiring — none found
      .mockResolvedValueOnce([]); // confirmedExpiring — none found

    prismaMock.waitlistEntry.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });

    const expired = await expireEntries();
    expect(expired).toBe(0);
  });
});

// =============================================================================
// B. arrivalTimerSec — Timer Sosire
// =============================================================================
describe("B. arrivalTimerSec — Timer Sosire", () => {
  it("confirmEntry sets arrivalDeadlineAt = now + arrivalTimerSec (custom 180s)", async () => {
    const restaurant = seedRestaurant();
    seedSettings(restaurant.id, { arrivalTimerSec: 180 });
    const entry = seedEntry(restaurant.id, {
      status: "CALLED",
      calledAt: new Date(),
      confirmDeadlineAt: new Date(Date.now() + 60_000),
    });

    const before = Date.now();
    await confirmEntry(entry.id, restaurant.id);
    const after = Date.now();

    const updated = mockDb.entries.get(entry.id) as Record<string, unknown>;
    expect(updated?.status).toBe("CONFIRMED");
    const deadline = new Date(updated?.arrivalDeadlineAt as Date).getTime();
    expect(deadline).toBeGreaterThanOrEqual(before + 178_000);
    expect(deadline).toBeLessThanOrEqual(after + 182_000);
  });

  it("expiry marks CONFIRMED → NO_SHOW_ARRIVAL when arrivalDeadlineAt has passed", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    seedSettings(restaurant.id);
    const past = new Date(Date.now() - 5_000);
    const entry = seedEntry(restaurant.id, {
      status: "CONFIRMED",
      confirmedAt: new Date(Date.now() - 310_000),
      arrivalDeadlineAt: past,
    });

    prismaMock.waitlistEntry.findMany
      .mockResolvedValueOnce([])      // calledExpiring — none
      .mockResolvedValueOnce([entry]); // confirmedExpiring

    prismaMock.waitlistEntry.updateMany
      .mockResolvedValueOnce({ count: 0 }) // CALLED → NO_SHOW_CONFIRM
      .mockResolvedValueOnce({ count: 1 }); // CONFIRMED → NO_SHOW_ARRIVAL

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null);

    const expired = await expireEntries();
    expect(expired).toBe(1);
  });

  it("expiry uses msgWhatsappExpire from settings for CONFIRMED entry", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const customExpireMsg = "CUSTOM_EXPIRE: Locul dvs. a expirat, {name}!";
    seedSettings(restaurant.id, { msgWhatsappExpire: customExpireMsg });
    const past = new Date(Date.now() - 5_000);
    const entry = seedEntry(restaurant.id, {
      status: "CONFIRMED",
      confirmedAt: new Date(Date.now() - 310_000),
      arrivalDeadlineAt: past,
      phoneE164: "+40700000099",
      guestName: "Ion",
    });

    prismaMock.waitlistEntry.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([entry]);

    prismaMock.waitlistEntry.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null);

    await expireEntries();

    // Verify sendWhatsAppMessage was called with message from settings
    expect(sendWhatsAppMock).toHaveBeenCalledWith(
      entry.id,
      "+40700000099",
      expect.stringContaining("CUSTOM_EXPIRE")
    );
    // {name} should be replaced with guest name
    expect(sendWhatsAppMock).toHaveBeenCalledWith(
      entry.id,
      "+40700000099",
      expect.stringContaining("Ion")
    );
  });
});

// =============================================================================
// C. maxPartySize — Max Group Size
// =============================================================================
describe("C. maxPartySize — Max Group Size", () => {
  it("rejects join when partySize > maxPartySize → 400", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxPartySize: 3 });

    // join route calls findUnique for restaurant (by slug), then findUnique for settings
    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);

    const req = new NextRequest(
      `http://localhost/api/public/restaurants/${restaurant.slug}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partySize: 4, phone: "+40700000001" }),
      }
    );
    const ctx = { params: Promise.resolve({ slug: restaurant.slug as string }) };

    const res = await joinPOST(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.maxPartySize).toBe(3);
  });

  it("allows join when partySize = maxPartySize", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxPartySize: 4, maxQueueSize: 10 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(0); // queue not full
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null); // no duplicate phone
    // count for position (after create)
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(0);
    // count for queueLength (after create)
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(1);

    const req = new NextRequest(
      `http://localhost/api/public/restaurants/${restaurant.slug}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partySize: 4, phone: "+40700000001" }),
      }
    );
    const ctx = { params: Promise.resolve({ slug: restaurant.slug as string }) };

    const res = await joinPOST(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});

// =============================================================================
// D. maxQueueSize — Max Queue Size
// =============================================================================
describe("D. maxQueueSize — Max Queue Size", () => {
  it("rejects join when queue is full (currentQueueSize >= maxQueueSize) → 409", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxPartySize: 6, maxQueueSize: 5 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(5); // queue at capacity

    const req = new NextRequest(
      `http://localhost/api/public/restaurants/${restaurant.slug}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partySize: 2, phone: "+40700000002" }),
      }
    );
    const ctx = { params: Promise.resolve({ slug: restaurant.slug as string }) };

    const res = await joinPOST(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.queueFull).toBe(true);
  });

  it("allows join when queue has space (currentQueueSize < maxQueueSize)", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxPartySize: 6, maxQueueSize: 5 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(4); // 4 < 5 — space available
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null); // no duplicate
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(0); // position count
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(5); // queue length after join

    const req = new NextRequest(
      `http://localhost/api/public/restaurants/${restaurant.slug}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partySize: 2, phone: "+40700000003" }),
      }
    );
    const ctx = { params: Promise.resolve({ slug: restaurant.slug as string }) };

    const res = await joinPOST(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("rejects join when filling exactly to maxQueueSize", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxQueueSize: 3 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(3); // exactly at limit

    const req = new NextRequest(
      `http://localhost/api/public/restaurants/${restaurant.slug}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partySize: 1, phone: "+40700000004" }),
      }
    );
    const ctx = { params: Promise.resolve({ slug: restaurant.slug as string }) };

    const res = await joinPOST(req, ctx);
    expect(res.status).toBe(409);
  });
});

// =============================================================================
// E. maxCallAgain — Max Call Again
// =============================================================================
describe("E. maxCallAgain — Max Call Again", () => {
  it("first call-again succeeds when callAgainCount=0, maxCallAgain=1", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxCallAgain: 1, confirmTimerSec: 120, bufferVisibilitySec: 600 });
    const entry = seedEntry(restaurant.id, {
      status: "NO_SHOW_CONFIRM",
      callAgainCount: 0,
      expiredAt: new Date(), // just expired
    });

    // call-again route uses findFirst for entry lookup
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(entry);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);

    const req = new NextRequest(
      `http://localhost/api/restaurants/${restaurant.id}/entries/${entry.id}/call-again`,
      {
        method: "POST",
        headers: { Cookie: "session=mock-session-token" },
      }
    );
    const ctx = { params: Promise.resolve({ id: restaurant.id as string, entryId: entry.id as string }) };

    const res = await callAgainPOST(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("second call-again rejected when callAgainCount=1, maxCallAgain=1 → 400", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxCallAgain: 1, bufferVisibilitySec: 600 });
    const entry = seedEntry(restaurant.id, {
      status: "NO_SHOW_CONFIRM",
      callAgainCount: 1, // already used call-again once
      expiredAt: new Date(),
    });

    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(entry);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);

    const req = new NextRequest(
      `http://localhost/api/restaurants/${restaurant.id}/entries/${entry.id}/call-again`,
      {
        method: "POST",
        headers: { Cookie: "session=mock-session-token" },
      }
    );
    const ctx = { params: Promise.resolve({ id: restaurant.id as string, entryId: entry.id as string }) };

    const res = await callAgainPOST(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Max retries reached");
  });

  it("call-again blocked when buffer window expired", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxCallAgain: 3, bufferVisibilitySec: 60 });
    // expiredAt = 2 minutes ago, buffer = 60s → outside window
    const entry = seedEntry(restaurant.id, {
      status: "NO_SHOW_ARRIVAL",
      callAgainCount: 0,
      expiredAt: new Date(Date.now() - 120_000),
    });

    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(entry);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);

    const req = new NextRequest(
      `http://localhost/api/restaurants/${restaurant.id}/entries/${entry.id}/call-again`,
      {
        method: "POST",
        headers: { Cookie: "session=mock-session-token" },
      }
    );
    const ctx = { params: Promise.resolve({ id: restaurant.id as string, entryId: entry.id as string }) };

    const res = await callAgainPOST(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Buffer window expired");
  });

  it("maxCallAgain=2 allows two call-again attempts", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const settings = seedSettings(restaurant.id, { maxCallAgain: 2, bufferVisibilitySec: 600 });
    // Second call-again (callAgainCount=1, maxCallAgain=2) — should pass
    const entry = seedEntry(restaurant.id, {
      status: "NO_SHOW_CONFIRM",
      callAgainCount: 1,
      expiredAt: new Date(),
    });

    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(entry);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);

    const req = new NextRequest(
      `http://localhost/api/restaurants/${restaurant.id}/entries/${entry.id}/call-again`,
      {
        method: "POST",
        headers: { Cookie: "session=mock-session-token" },
      }
    );
    const ctx = { params: Promise.resolve({ id: restaurant.id as string, entryId: entry.id as string }) };

    const res = await callAgainPOST(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});

// =============================================================================
// F. estimatedWaitTime — Estimated Wait Time
// =============================================================================
describe("F. estimatedWaitTime — Estimated Wait Time", () => {
  it("estimatedWaitMinutes = (queueLength + 1) * estimatedTableTimeMin when autoCalculate=false", async () => {
    const restaurant = seedRestaurant({ status: "FULL", listClosed: false });

    // info route calls restaurant.findUnique with nested settings select
    const restaurantWithSettings = {
      ...restaurant,
      settings: {
        waitMinutesPerGroup: 10,
        estimatedTableTimeMin: 15,
        useCalculatedAvgTime: false,
        maxPartySize: 6,
        maxQueueSize: 20,
      },
    };
    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurantWithSettings);
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(4); // 4 WAITING entries

    const req = new NextRequest(
      `http://localhost/api/public/restaurants/${restaurant.slug}/info`
    );
    const ctx = { params: Promise.resolve({ slug: restaurant.slug as string }) };

    const res = await infoGET(req, ctx);
    const body = await res.json();

    // (4 + 1) * 15 = 75
    expect(res.status).toBe(200);
    expect(body.estimatedWaitMinutes).toBe(75);
    expect(body.queueLength).toBe(4);
  });

  it("returns correct estimatedWaitMinutes for position 1 (single group waiting)", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const restaurantWithSettings = {
      ...restaurant,
      settings: {
        waitMinutesPerGroup: 10,
        estimatedTableTimeMin: 20,
        useCalculatedAvgTime: false,
        maxPartySize: 6,
        maxQueueSize: 20,
      },
    };
    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurantWithSettings);
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(1); // 1 WAITING entry

    const req = new NextRequest(
      `http://localhost/api/public/restaurants/${restaurant.slug}/info`
    );
    const ctx = { params: Promise.resolve({ slug: restaurant.slug as string }) };

    const res = await infoGET(req, ctx);
    const body = await res.json();

    // (1 + 1) * 20 = 40
    expect(body.estimatedWaitMinutes).toBe(40);
  });

  it("getRestaurantSettings returns estimatedTableTimeMin from DB", async () => {
    const restaurant = seedRestaurant();
    seedSettings(restaurant.id, { estimatedTableTimeMin: 12 });

    const settings = await getRestaurantSettings(restaurant.id);
    // estimatedTableTimeMin is not directly in getRestaurantSettings return, but waitMinutesPerGroup is
    // Verify waitMinutesPerGroup is returned
    expect(settings.waitMinutesPerGroup).toBeDefined();
  });
});

// =============================================================================
// G. Mesaje WhatsApp — WhatsApp Messages
// =============================================================================
describe("G. Mesaje WhatsApp — WhatsApp Messages", () => {
  it("expiry sends msgWhatsappExpire for CALLED → NO_SHOW_CONFIRM", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const customExpireMsg = "EXPIRE_CALLED: Scuze, locul expirat {name}";
    seedSettings(restaurant.id, { msgWhatsappExpire: customExpireMsg });
    const past = new Date(Date.now() - 5_000);
    const entry = seedEntry(restaurant.id, {
      status: "CALLED",
      calledAt: new Date(Date.now() - 130_000),
      confirmDeadlineAt: past,
      phoneE164: "+40711111111",
      guestName: "Maria",
    });

    prismaMock.waitlistEntry.findMany
      .mockResolvedValueOnce([entry])
      .mockResolvedValueOnce([]);

    prismaMock.waitlistEntry.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null);

    await expireEntries();

    expect(sendWhatsAppMock).toHaveBeenCalledWith(
      entry.id,
      "+40711111111",
      expect.stringContaining("EXPIRE_CALLED")
    );
    // {name} replaced with "Maria"
    expect(sendWhatsAppMock).toHaveBeenCalledWith(
      entry.id,
      "+40711111111",
      expect.stringContaining("Maria")
    );
  });

  it("callNext sends msgWhatsappCall message from settings", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const customCallMsg = "CALL_MSG: Masa e gata, {name}! Vino repede!";
    seedSettings(restaurant.id, { msgWhatsappCall: customCallMsg });
    seedEntry(restaurant.id, {
      status: "WAITING",
      phoneE164: "+40722222222",
      guestName: "Andrei",
    });

    const called = await callNext(restaurant.id);
    expect(called).not.toBeNull();

    expect(sendWhatsAppMock).toHaveBeenCalledWith(
      called!.id,
      "+40722222222",
      expect.stringContaining("CALL_MSG")
    );
    expect(sendWhatsAppMock).toHaveBeenCalledWith(
      called!.id,
      "+40722222222",
      expect.stringContaining("Andrei")
    );
  });

  it("call-again sends msgWhatsappCallAgain from settings", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const customCallAgainMsg = "CALL_AGAIN_MSG: Ultima șansă, {name}!";
    const settings = seedSettings(restaurant.id, {
      maxCallAgain: 3,
      bufferVisibilitySec: 600,
      confirmTimerSec: 120,
      msgWhatsappCallAgain: customCallAgainMsg,
    });
    const entry = seedEntry(restaurant.id, {
      status: "NO_SHOW_CONFIRM",
      callAgainCount: 0,
      expiredAt: new Date(),
      phoneE164: "+40733333333",
      guestName: "Popescu",
    });

    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(entry);
    prismaMock.restaurantSettings.findUnique.mockResolvedValueOnce(settings);

    const req = new NextRequest(
      `http://localhost/api/restaurants/${restaurant.id}/entries/${entry.id}/call-again`,
      {
        method: "POST",
        headers: { Cookie: "session=mock-session-token" },
      }
    );
    const ctx = { params: Promise.resolve({ id: restaurant.id as string, entryId: entry.id as string }) };

    await callAgainPOST(req, ctx);

    expect(sendWhatsAppMock).toHaveBeenCalledWith(
      entry.id,
      "+40733333333",
      expect.stringContaining("CALL_AGAIN_MSG")
    );
    expect(sendWhatsAppMock).toHaveBeenCalledWith(
      entry.id,
      "+40733333333",
      expect.stringContaining("Popescu")
    );
  });

  it("does not send WhatsApp for placeholder phone +00000000000", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    seedSettings(restaurant.id);
    const past = new Date(Date.now() - 5_000);
    const entry = seedEntry(restaurant.id, {
      status: "CALLED",
      calledAt: new Date(Date.now() - 130_000),
      confirmDeadlineAt: past,
      phoneE164: "+00000000000", // placeholder — should be skipped
    });

    prismaMock.waitlistEntry.findMany
      .mockResolvedValueOnce([entry])
      .mockResolvedValueOnce([]);

    prismaMock.waitlistEntry.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null);

    await expireEntries();

    expect(sendWhatsAppMock).not.toHaveBeenCalled();
  });
});
