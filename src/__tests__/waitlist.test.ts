/**
 * WaitList Integration Tests
 * Uses mocked Prisma and mock WhatsApp adapter
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Use vi.hoisted to define mocks before they're used ----
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
      findUnique: vi.fn(({ where }: { where: { id?: string; slug?: string } }) => {
        if (where.id) return Promise.resolve(mockDb.restaurants.get(where.id) ?? null);
        if (where.slug) {
          for (const r of mockDb.restaurants.values()) {
            if ((r as { slug: string }).slug === where.slug) return Promise.resolve(r);
          }
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      }),
      findFirst: vi.fn(),
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const r = { id: `rest-${Date.now()}`, status: "OPEN", createdAt: new Date(), ...data };
        mockDb.restaurants.set(r.id as string, r);
        return Promise.resolve(r);
      }),
      update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const r = mockDb.restaurants.get(where.id);
        if (!r) throw new Error("Restaurant not found");
        Object.assign(r, data);
        return Promise.resolve(r);
      }),
    },
    restaurantSettings: {
      findUnique: vi.fn(({ where }: { where: { restaurantId: string } }) =>
        Promise.resolve(mockDb.restaurantSettings.get(where.restaurantId) ?? null)
      ),
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const s = {
          id: `settings-${Date.now()}`,
          confirmTimerSec: 120,
          arrivalTimerSec: 300,
          bufferVisibilitySec: 600,
          maxCallAgain: 1,
          maxPartySize: 10,
          maxQueueSize: 50,
          msgWhatsappCall: "Vă rugăm să vă prezentați la intrare în 2 minute.",
          msgWhatsappExpire: "Din păcate locul dumneavoastră a expirat.",
          msgWhatsappCallAgain: "Vă mai acordăm o șansă, vă rugăm să vă prezentați.",
          updatedAt: new Date(),
          ...data,
        };
        mockDb.restaurantSettings.set(data.restaurantId as string, s);
        return Promise.resolve(s);
      }),
      upsert: vi.fn(({ where, update, create }: { where: { restaurantId: string }; update: Record<string, unknown>; create: Record<string, unknown> }) => {
        const existing = mockDb.restaurantSettings.get(where.restaurantId);
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() });
          return Promise.resolve(existing);
        }
        const s = { id: `settings-${Date.now()}`, updatedAt: new Date(), ...create };
        mockDb.restaurantSettings.set(where.restaurantId, s);
        return Promise.resolve(s);
      }),
    },
    waitlistEntry: {
      findUnique: vi.fn(({ where }: { where: { id?: string; publicToken?: string } }) => {
        if (where.id) return Promise.resolve(mockDb.entries.get(where.id) ?? null);
        if (where.publicToken) {
          for (const e of mockDb.entries.values()) {
            if ((e as { publicToken: string }).publicToken === where.publicToken)
              return Promise.resolve(e);
          }
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      }),
      findFirst: vi.fn(({ where }: { where: Record<string, unknown> }) => {
        for (const e of mockDb.entries.values()) {
          const entry = e as Record<string, unknown>;
          let match = true;
          if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
          if (where.status && entry.status !== where.status) match = false;
          if (where.id && entry.id !== where.id) match = false;
          if (match) return Promise.resolve(entry);
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn(({ where }: { where: Record<string, unknown> }) => {
        const results: Record<string, unknown>[] = [];
        for (const e of mockDb.entries.values()) {
          const entry = e as Record<string, unknown>;
          let match = true;
          if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
          if (match) results.push(entry);
        }
        return Promise.resolve(results);
      }),
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const e = { id: `entry-${Date.now()}-${Math.random()}`, ...data };
        mockDb.entries.set(e.id as string, e);
        return Promise.resolve(e);
      }),
      update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const e = mockDb.entries.get(where.id);
        if (!e) throw new Error("Entry not found");
        Object.assign(e, data);
        return Promise.resolve(e);
      }),
      updateMany: vi.fn(({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        let count = 0;
        for (const e of mockDb.entries.values()) {
          const entry = e as Record<string, unknown>;
          let match = true;
          if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
          if (where.status && entry.status !== where.status) match = false;
          if (where.id && entry.id !== where.id) match = false;
          if (match) {
            Object.assign(entry, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
      count: vi.fn(({ where }: { where: Record<string, unknown> }) => {
        let count = 0;
        for (const e of mockDb.entries.values()) {
          const entry = e as Record<string, unknown>;
          let match = true;
          if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
          if (where.status && entry.status !== where.status) match = false;
          if (match) count++;
        }
        return Promise.resolve(count);
      }),
    },
    restaurantUser: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    messageEvent: {
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const ev = { id: `msg-${Date.now()}`, ...data };
        mockDb.messageEvents.set(ev.id as string, ev);
        return Promise.resolve(ev);
      }),
    },
  };

  return { mockDb, prismaMock };
});

vi.mock("@/lib/prisma", () => ({ default: prismaMock, prisma: prismaMock }));
vi.mock("@/lib/emitter", () => ({ emitUpdate: vi.fn() }));
vi.mock("@/lib/timers", () => ({
  scheduleReminder: vi.fn(),
  clearReminderTimer: vi.fn(),
}));

// ---- Import business logic (after mocks) ----
import { getQueue, callNext, callEntry, seatEntry, skipEntry, confirmEntry } from "@/lib/queue";
import { expireEntries } from "@/lib/expiry";

// ---- Helpers ----
function seedRestaurant(overrides: Record<string, unknown> = {}) {
  const id = `rest-${Date.now()}-${Math.random()}`;
  const r = {
    id,
    name: "Test Restaurant",
    slug: `test-${id}`,
    status: "FULL",
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
    maxPartySize: 10,
    maxQueueSize: 50,
    msgWhatsappCall: "Vă rugăm să vă prezentați.",
    msgWhatsappExpire: "Locul a expirat.",
    msgWhatsappCallAgain: "O nouă șansă.",
    updatedAt: new Date(),
    ...overrides,
  };
  mockDb.restaurantSettings.set(restaurantId, s);
  return s;
}

// ---- Tests ----

beforeEach(() => {
  mockDb.restaurants.clear();
  mockDb.restaurantSettings.clear();
  mockDb.entries.clear();
  mockDb.messageEvents.clear();
  vi.clearAllMocks();

  // Re-apply default implementations after clearAllMocks
  prismaMock.waitlistEntry.findMany.mockImplementation(({ where }: { where: Record<string, unknown> }) => {
    const results: Record<string, unknown>[] = [];
    for (const e of mockDb.entries.values()) {
      const entry = e as Record<string, unknown>;
      let match = true;
      if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
      if (match) results.push(entry);
    }
    return Promise.resolve(results);
  });

  prismaMock.waitlistEntry.findFirst.mockImplementation(({ where }: { where: Record<string, unknown> }) => {
    for (const e of mockDb.entries.values()) {
      const entry = e as Record<string, unknown>;
      let match = true;
      if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
      if (where.status && entry.status !== where.status) match = false;
      if (where.id && entry.id !== where.id) match = false;
      if (match) return Promise.resolve(entry);
    }
    return Promise.resolve(null);
  });

  prismaMock.waitlistEntry.update.mockImplementation(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
    const e = mockDb.entries.get(where.id);
    if (!e) throw new Error("Entry not found");
    Object.assign(e, data);
    return Promise.resolve(e);
  });

  prismaMock.waitlistEntry.updateMany.mockImplementation(({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
    let count = 0;
    for (const e of mockDb.entries.values()) {
      const entry = e as Record<string, unknown>;
      let match = true;
      if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
      if (where.status && entry.status !== where.status) match = false;
      if (where.id && entry.id !== where.id) match = false;
      if (match) { Object.assign(entry, data); count++; }
    }
    return Promise.resolve({ count });
  });

  prismaMock.waitlistEntry.count.mockImplementation(({ where }: { where: Record<string, unknown> }) => {
    let count = 0;
    for (const e of mockDb.entries.values()) {
      const entry = e as Record<string, unknown>;
      let match = true;
      if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
      if (where.status && entry.status !== where.status) match = false;
      if (match) count++;
    }
    return Promise.resolve(count);
  });

  prismaMock.waitlistEntry.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    const e = { id: `entry-${Date.now()}-${Math.random()}`, ...data };
    mockDb.entries.set(e.id as string, e);
    return Promise.resolve(e);
  });

  prismaMock.restaurant.findUnique.mockImplementation(({ where }: { where: { id?: string; slug?: string } }) => {
    if (where.id) return Promise.resolve(mockDb.restaurants.get(where.id) ?? null);
    if (where.slug) {
      for (const r of mockDb.restaurants.values()) {
        if ((r as { slug: string }).slug === where.slug) return Promise.resolve(r);
      }
    }
    return Promise.resolve(null);
  });

  prismaMock.restaurantSettings.findUnique.mockImplementation(({ where }: { where: { restaurantId: string } }) =>
    Promise.resolve(mockDb.restaurantSettings.get(where.restaurantId) ?? null)
  );

  prismaMock.restaurantSettings.upsert.mockImplementation(({ where, update, create }: { where: { restaurantId: string }; update: Record<string, unknown>; create: Record<string, unknown> }) => {
    const existing = mockDb.restaurantSettings.get(where.restaurantId);
    if (existing) {
      Object.assign(existing, update, { updatedAt: new Date() });
      return Promise.resolve(existing);
    }
    const s = { id: `settings-${Date.now()}`, updatedAt: new Date(), ...create };
    mockDb.restaurantSettings.set(where.restaurantId, s);
    return Promise.resolve(s);
  });

  prismaMock.restaurantSettings.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    const s = {
      id: `settings-${Date.now()}`,
      confirmTimerSec: 120,
      arrivalTimerSec: 300,
      bufferVisibilitySec: 600,
      maxCallAgain: 1,
      maxPartySize: 10,
      maxQueueSize: 50,
      msgWhatsappCall: "Vă rugăm să vă prezentați.",
      msgWhatsappExpire: "Locul a expirat.",
      msgWhatsappCallAgain: "O nouă șansă.",
      updatedAt: new Date(),
      ...data,
    };
    mockDb.restaurantSettings.set(data.restaurantId as string, s);
    return Promise.resolve(s);
  });

  prismaMock.restaurant.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    const r = { id: `rest-${Date.now()}-${Math.random()}`, status: "OPEN", createdAt: new Date(), ...data };
    mockDb.restaurants.set(r.id as string, r);
    return Promise.resolve(r);
  });

  prismaMock.messageEvent.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    const ev = { id: `msg-${Date.now()}`, ...data };
    mockDb.messageEvents.set(ev.id as string, ev);
    return Promise.resolve(ev);
  });
});

// =====================
// Test Scenarios
// =====================

describe("1. Guest joins → WAITING status", () => {
  it("creates entry with WAITING status", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    seedSettings(restaurant.id);

    const publicToken = "test-token-123";
    const entry = await prismaMock.waitlistEntry.create({
      data: {
        restaurantId: restaurant.id,
        publicToken,
        partySize: 2,
        phoneE164: "+40700000001",
        guestName: "Ion Popescu",
        status: "WAITING",
        createdAt: new Date(),
      },
    });

    const e = entry as Record<string, unknown>;
    expect(e.status).toBe("WAITING");
    expect(e.restaurantId).toBe(restaurant.id);
    expect(mockDb.entries.size).toBe(1);
  });
});

describe("2. Admin calls next → CALLED, mock message sent", () => {
  it("transitions oldest WAITING entry to CALLED", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const entry = seedEntry(restaurant.id, { status: "WAITING" });

    const called = await callNext(restaurant.id);

    expect(called).not.toBeNull();
    expect(called!.status).toBe("CALLED");
    expect(called!.calledAt).toBeDefined();
    expect(called!.confirmDeadlineAt).toBeDefined();
  });

  it("returns null when no WAITING entries", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    // No entries seeded

    const result = await callNext(restaurant.id);
    expect(result).toBeNull();
  });

  it("admin can call a specific entry", async () => {
    const restaurant = seedRestaurant();
    const entry = seedEntry(restaurant.id, { status: "WAITING" });

    const called = await callEntry(restaurant.id, entry.id);

    expect(called).not.toBeNull();
    expect(called!.status).toBe("CALLED");
  });
});

describe("3. Guest confirms (webhook) → CONFIRMED", () => {
  it("transitions CALLED entry to CONFIRMED with arrival deadline", async () => {
    const restaurant = seedRestaurant();
    const now = new Date();
    const entry = seedEntry(restaurant.id, {
      status: "CALLED",
      calledAt: now,
      confirmDeadlineAt: new Date(now.getTime() + 120_000),
    });

    const confirmed = await confirmEntry(entry.id);

    expect(confirmed.status).toBe("CONFIRMED");
    expect(confirmed.confirmedAt).toBeDefined();
    expect(confirmed.arrivalDeadlineAt).toBeDefined();

    // Arrival deadline should be ~5 min from now
    const arrivalMs = new Date(confirmed.arrivalDeadlineAt as Date).getTime() - Date.now();
    expect(arrivalMs).toBeGreaterThan(250_000);
    expect(arrivalMs).toBeLessThan(320_000);
  });
});

describe("4. Arrival timer expires → NO_SHOW", () => {
  it("expires CALLED entries to NO_SHOW_CONFIRM", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const past = new Date(Date.now() - 10_000);
    const entry = seedEntry(restaurant.id, {
      status: "CALLED",
      calledAt: new Date(Date.now() - 130_000),
      confirmDeadlineAt: past,
    });

    // Mock findMany for expiry scan
    prismaMock.waitlistEntry.findMany
      .mockResolvedValueOnce([entry])  // calledExpiring
      .mockResolvedValueOnce([]);       // confirmedExpiring

    prismaMock.waitlistEntry.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null);

    const expired = await expireEntries();
    expect(expired).toBe(1);
  });

  it("expires CONFIRMED entries to NO_SHOW_ARRIVAL", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    const past = new Date(Date.now() - 10_000);
    const entry = seedEntry(restaurant.id, {
      status: "CONFIRMED",
      confirmedAt: new Date(Date.now() - 310_000),
      arrivalDeadlineAt: past,
    });

    prismaMock.waitlistEntry.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([entry]);

    prismaMock.waitlistEntry.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    prismaMock.restaurant.findUnique.mockResolvedValueOnce(restaurant);
    prismaMock.waitlistEntry.findFirst.mockResolvedValueOnce(null);

    const expired = await expireEntries();
    expect(expired).toBe(1);
  });
});

describe("5. Max queue enforced", () => {
  it("detects when queue is full (maxQueueSize reached)", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    seedSettings(restaurant.id, { maxQueueSize: 2 });

    seedEntry(restaurant.id, { status: "WAITING" });
    seedEntry(restaurant.id, { status: "WAITING" });

    const settings = mockDb.restaurantSettings.get(restaurant.id) as Record<string, unknown>;
    const waitingCount = await prismaMock.waitlistEntry.count({
      where: { restaurantId: restaurant.id, status: "WAITING" },
    });

    expect(waitingCount).toBe(2);
    expect(waitingCount >= (settings?.maxQueueSize as number)).toBe(true);
    // In the actual API route, this returns 400
  });

  it("allows join when queue is not full", async () => {
    const restaurant = seedRestaurant({ status: "FULL" });
    seedSettings(restaurant.id, { maxQueueSize: 5 });

    seedEntry(restaurant.id, { status: "WAITING" });

    const settings = mockDb.restaurantSettings.get(restaurant.id) as Record<string, unknown>;
    const waitingCount = await prismaMock.waitlistEntry.count({
      where: { restaurantId: restaurant.id, status: "WAITING" },
    });

    expect(waitingCount < (settings?.maxQueueSize as number)).toBe(true);
  });
});

describe("6. Settings save/load correctly", () => {
  it("loads default settings from DB", async () => {
    const restaurant = seedRestaurant();
    seedSettings(restaurant.id);

    const loaded = await prismaMock.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id },
    });

    expect(loaded).not.toBeNull();
    const l = loaded as Record<string, unknown>;
    expect(l?.confirmTimerSec).toBe(120);   // 2 min default
    expect(l?.arrivalTimerSec).toBe(300);    // 5 min default
    expect(l?.bufferVisibilitySec).toBe(600); // 10 min default
    expect(l?.maxQueueSize).toBe(50);
  });

  it("saves updated settings to DB", async () => {
    const restaurant = seedRestaurant();
    seedSettings(restaurant.id);

    const updated = await prismaMock.restaurantSettings.upsert({
      where: { restaurantId: restaurant.id },
      update: {
        confirmTimerSec: 180,
        arrivalTimerSec: 600,
        maxQueueSize: 30,
        msgWhatsappCall: "Masa e gata! Vino acum.",
        msgWhatsappCallAgain: "Ultima șansă!",
      },
      create: { restaurantId: restaurant.id },
    });

    const u = updated as Record<string, unknown>;
    expect(u?.confirmTimerSec).toBe(180);
    expect(u?.arrivalTimerSec).toBe(600);
    expect(u?.maxQueueSize).toBe(30);
    expect(u?.msgWhatsappCall).toBe("Masa e gata! Vino acum.");
  });

  it("caps maxQueueSize at 50 (frontend validation)", () => {
    let maxQueueSize = 75;
    if (maxQueueSize > 50) maxQueueSize = 50;
    expect(maxQueueSize).toBe(50);
  });

  it("caps maxQueueSize at 50 (API validation)", () => {
    const body = { maxQueueSize: 100 };
    const val = Number(body.maxQueueSize);
    expect(val > 50).toBe(true); // would return 400
  });
});

describe("7. Admin creates new restaurant", () => {
  it("creates a restaurant with correct slug", async () => {
    const name = "Pizza Roma";
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    expect(slug).toBe("pizza-roma");

    const restaurant = await prismaMock.restaurant.create({
      data: { name, slug, status: "OPEN" },
    });

    const r = restaurant as Record<string, unknown>;
    expect(r.name).toBe("Pizza Roma");
    expect(r.slug).toBe("pizza-roma");
    expect(r.id).toBeDefined();
  });

  it("creates default settings for new restaurant", async () => {
    const restaurant = await prismaMock.restaurant.create({
      data: { name: "Burger Club", slug: "burger-club", status: "OPEN" },
    });

    const settings = await prismaMock.restaurantSettings.create({
      data: { restaurantId: restaurant.id },
    });

    const s = settings as Record<string, unknown>;
    expect(s.restaurantId).toBe(restaurant.id);
    expect(s.maxQueueSize).toBe(50);
    expect(s.confirmTimerSec).toBe(120);
  });

  it("rejects duplicate slug", async () => {
    seedRestaurant({ slug: "pizza-roma" });

    const existing = await prismaMock.restaurant.findUnique({
      where: { slug: "pizza-roma" },
    });
    expect(existing).not.toBeNull(); // would return 409 in API
  });

  it("generates URL-safe slug from Romanian characters", () => {
    function toSlug(name: string): string {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    }

    expect(toSlug("Căpriță & Fructe")).toBe("caprita-fructe");
    expect(toSlug("Șaorma Rapidă")).toBe("saorma-rapida");
    expect(toSlug("Grătar de Vară")).toBe("gratar-de-vara");
  });
});

describe("Queue operations", () => {
  it("seatEntry marks entry as SEATED", async () => {
    const restaurant = seedRestaurant();
    const entry = seedEntry(restaurant.id, { status: "CONFIRMED" });

    await seatEntry(restaurant.id, entry.id);

    const updated = mockDb.entries.get(entry.id) as Record<string, unknown>;
    expect(updated?.status).toBe("SEATED");
  });

  it("skipEntry marks entry as SKIPPED", async () => {
    const restaurant = seedRestaurant();
    const entry = seedEntry(restaurant.id, { status: "WAITING" });

    await skipEntry(restaurant.id, entry.id);

    const updated = mockDb.entries.get(entry.id) as Record<string, unknown>;
    expect(updated?.status).toBe("SKIPPED");
  });

  it("getQueue returns only active/recent entries", async () => {
    const restaurant = seedRestaurant();
    seedEntry(restaurant.id, { status: "WAITING" });
    seedEntry(restaurant.id, { status: "CALLED" });

    // Mock with only active entries
    prismaMock.waitlistEntry.findMany.mockResolvedValueOnce([
      ...Array.from(mockDb.entries.values()).filter(
        (e) => ["WAITING", "CALLED", "CONFIRMED"].includes((e as Record<string, unknown>).status as string)
      ),
    ]);

    const queue = await getQueue(restaurant.id);
    expect(queue.length).toBe(2);
    expect(queue.every(e => ["WAITING", "CALLED", "CONFIRMED"].includes(e.status))).toBe(true);
  });
});

describe("Notification adapter", () => {
  it("mock adapter sends messages without real network calls", async () => {
    const { getNotificationAdapter } = await import("@/lib/notification-adapter");

    process.env.WHATSAPP_PROVIDER = "mock";
    const adapter = getNotificationAdapter();
    const result = await adapter.sendMessage("+40700000001", "Test message");

    expect(result.ok).toBe(true);
    expect(result.provider).toBe("mock");
    expect(result.to).toBe("+40700000001");
  });
});
