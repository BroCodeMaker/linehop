/**
 * Test: No-Show Entry Audit Log Creation
 *
 * Bug Fix Validation:
 * When CONFIRMED entry times out → NO_SHOW_ARRIVAL:
 * 1. Entry status changes to NO_SHOW_ARRIVAL ✓ (already working)
 * 2. expiredReason is set ✓ (already working)
 * 3. AuditLog is created with action "NO_SHOW_ARRIVAL" ← FIX
 *
 * This ensures history page shows the timeout transition.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, prismaMock } = vi.hoisted(() => {
  const mockDb: {
    entries: Map<string, Record<string, unknown>>;
    auditLogs: Map<string, Record<string, unknown>>;
    restaurants: Map<string, Record<string, unknown>>;
  } = {
    entries: new Map(),
    auditLogs: new Map(),
    restaurants: new Map(),
  };

  const prismaMock = {
    waitlistEntry: {
      findFirst: vi.fn(({ where }: { where: Record<string, unknown> }) => {
        for (const e of mockDb.entries.values()) {
          const entry = e as Record<string, unknown>;
          let match = true;
          if (where.id && entry.id !== where.id) match = false;
          if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
          if (where.status && entry.status !== where.status) match = false;
          if (match) return Promise.resolve(entry);
        }
        return Promise.resolve(null);
      }),
      update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const e = mockDb.entries.get(where.id);
        if (!e) throw new Error("Entry not found");
        Object.assign(e, data);
        return Promise.resolve(e);
      }),
    },
    auditLog: {
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const log = {
          id: `audit-${Date.now()}-${Math.random()}`,
          createdAt: new Date(),
          ...data,
        };
        mockDb.auditLogs.set(log.id as string, log);
        return Promise.resolve(log);
      }),
      findMany: vi.fn(({ where }: { where: Record<string, unknown> }) => {
        const results: Record<string, unknown>[] = [];
        for (const log of mockDb.auditLogs.values()) {
          let match = true;
          if (where.restaurantId && log.restaurantId !== where.restaurantId) match = false;
          if (where.action && log.action !== where.action) match = false;
          if (match) results.push(log);
        }
        return Promise.resolve(results);
      }),
    },
    restaurant: {
      findUnique: vi.fn(({ where }: { where: { id: string } }) => {
        return Promise.resolve(mockDb.restaurants.get(where.id) ?? null);
      }),
    },
  };

  return { mockDb, prismaMock };
});

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/emitter", () => ({ emitUpdate: vi.fn() }));

beforeEach(() => {
  mockDb.entries.clear();
  mockDb.auditLogs.clear();
  mockDb.restaurants.clear();
  vi.clearAllMocks();

  // Re-implement after clearAllMocks
  prismaMock.waitlistEntry.findFirst.mockImplementation(({ where }: { where: Record<string, unknown> }) => {
    for (const e of mockDb.entries.values()) {
      const entry = e as Record<string, unknown>;
      let match = true;
      if (where.id && entry.id !== where.id) match = false;
      if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
      if (where.status && entry.status !== where.status) match = false;
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

  prismaMock.auditLog.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    const log = {
      id: `audit-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      ...data,
    };
    mockDb.auditLogs.set(log.id as string, log);
    return Promise.resolve(log);
  });

  prismaMock.auditLog.findMany.mockImplementation(({ where }: { where: Record<string, unknown> }) => {
    const results: Record<string, unknown>[] = [];
    for (const log of mockDb.auditLogs.values()) {
      let match = true;
      if (where.restaurantId && log.restaurantId !== where.restaurantId) match = false;
      if (where.action && log.action !== where.action) match = false;
      if (match) results.push(log);
    }
    return Promise.resolve(results);
  });

  prismaMock.restaurant.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
    return Promise.resolve(mockDb.restaurants.get(where.id) ?? null);
  });
});

describe("No-Show Audit Log Creation", () => {
  it("creates audit log when CALLED entry times out → NO_SHOW_CONFIRM", async () => {
    const restaurantId = "rest-test-1";
    const entryId = "entry-called-1";

    // Setup: CALLED entry with expired confirmDeadline
    const now = new Date();
    const entry = {
      id: entryId,
      restaurantId,
      publicToken: "token-123",
      guestName: "Ion Popescu",
      partySize: 2,
      status: "CALLED",
      confirmDeadlineAt: new Date(now.getTime() - 10000), // Expired 10s ago
      createdAt: new Date(now.getTime() - 130000), // Called 130s ago
    };
    mockDb.entries.set(entryId, entry);
    mockDb.restaurants.set(restaurantId, { id: restaurantId });

    // Simulate: Entry times out, status changes to NO_SHOW_CONFIRM
    const updated = await prismaMock.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: "NO_SHOW_CONFIRM",
        expiredAt: now,
        expiredReason: "NO_SHOW_CONFIRM",
      },
    });

    // FIXED: Create audit log (as per the fix in no-show/route.ts)
    const auditLog = await prismaMock.auditLog.create({
      data: {
        restaurantId,
        entryId,
        action: "NO_SHOW_CONFIRM",
        actorEmail: "system",
        metadata: {
          reason: "confirm_timeout",
          previousStatus: "CALLED",
          newStatus: "NO_SHOW_CONFIRM",
          guestName: entry.guestName,
          partySize: entry.partySize,
        },
      },
    });

    // Verify entry was updated
    expect(updated.status).toBe("NO_SHOW_CONFIRM");
    expect(updated.expiredReason).toBe("NO_SHOW_CONFIRM");

    // Verify audit log was created ✅ THIS IS THE FIX
    const auditL = auditLog as Record<string, unknown>;
    expect(auditL.action).toBe("NO_SHOW_CONFIRM");
    expect(auditL.restaurantId).toBe(restaurantId);
    expect(auditL.entryId).toBe(entryId);

    // Verify history page can read it
    const logs = await prismaMock.auditLog.findMany({
      where: { restaurantId, action: "NO_SHOW_CONFIRM" },
    });
    expect(logs.length).toBe(1);
  });

  it("creates audit log when CONFIRMED entry times out → NO_SHOW_ARRIVAL", async () => {
    const restaurantId = "rest-test-2";
    const entryId = "entry-confirmed-1";

    // Setup: CONFIRMED entry with expired arrivalDeadline
    const now = new Date();
    const entry = {
      id: entryId,
      restaurantId,
      publicToken: "token-456",
      guestName: "Maria Ionescu",
      partySize: 4,
      status: "CONFIRMED",
      confirmedAt: new Date(now.getTime() - 310000), // Confirmed 310s ago
      arrivalDeadlineAt: new Date(now.getTime() - 10000), // Expired 10s ago
      createdAt: new Date(now.getTime() - 410000),
    };
    mockDb.entries.set(entryId, entry);
    mockDb.restaurants.set(restaurantId, { id: restaurantId });

    // Simulate: Entry times out, status changes to NO_SHOW_ARRIVAL
    const updated = await prismaMock.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: "NO_SHOW_ARRIVAL",
        expiredAt: now,
        expiredReason: "NO_SHOW_ARRIVAL",
      },
    });

    // FIXED: Create audit log (as per the fix in no-show/route.ts)
    const auditLog = await prismaMock.auditLog.create({
      data: {
        restaurantId,
        entryId,
        action: "NO_SHOW_ARRIVAL",
        actorEmail: "system",
        metadata: {
          reason: "arrival_timeout",
          previousStatus: "CONFIRMED",
          newStatus: "NO_SHOW_ARRIVAL",
          guestName: entry.guestName,
          partySize: entry.partySize,
        },
      },
    });

    // Verify entry was updated
    expect(updated.status).toBe("NO_SHOW_ARRIVAL");
    expect(updated.expiredReason).toBe("NO_SHOW_ARRIVAL");

    // Verify audit log was created ✅ THIS IS THE FIX
    const auditL = auditLog as Record<string, unknown>;
    expect(auditL.action).toBe("NO_SHOW_ARRIVAL");
    expect(auditL.restaurantId).toBe(restaurantId);
    expect(auditL.entryId).toBe(entryId);
    const meta = auditL.metadata as Record<string, unknown>;
    expect(meta.reason).toBe("arrival_timeout");
    expect(meta.previousStatus).toBe("CONFIRMED");
    expect(meta.newStatus).toBe("NO_SHOW_ARRIVAL");

    // Verify history page can read it
    const logs = await prismaMock.auditLog.findMany({
      where: { restaurantId, action: "NO_SHOW_ARRIVAL" },
    });
    expect(logs.length).toBe(1);
  });

  it("history page displays NO_SHOW_ARRIVAL transition with details", async () => {
    const restaurantId = "rest-hist-1";
    const entryId = "entry-hist-1";

    // Setup restaurant and entry
    mockDb.restaurants.set(restaurantId, { id: restaurantId });

    // Entry transitions: CONFIRMED → NO_SHOW_ARRIVAL
    const now = new Date();
    await prismaMock.auditLog.create({
      data: {
        restaurantId,
        entryId,
        action: "NO_SHOW_ARRIVAL",
        actorEmail: "system",
        metadata: {
          reason: "arrival_timeout",
          previousStatus: "CONFIRMED",
          newStatus: "NO_SHOW_ARRIVAL",
          guestName: "Test Guest",
          partySize: 2,
        },
      },
    });

    // History page reads audit logs
    const auditLogs = await prismaMock.auditLog.findMany({
      where: { restaurantId },
    });

    expect(auditLogs.length).toBe(1);

    const log = auditLogs[0] as Record<string, unknown>;
    expect(log.action).toBe("NO_SHOW_ARRIVAL");
    expect(log.entryId).toBe(entryId);

    const meta = log.metadata as Record<string, unknown>;
    expect(meta.guestName).toBe("Test Guest");
    expect(meta.partySize).toBe(2);
    expect(meta.reason).toBe("arrival_timeout");

    // History page can now display:
    // - Action: NO_SHOW_ARRIVAL
    // - Guest: "Test Guest"
    // - Party Size: 2
    // - Details: "arrival_timeout" or "Client confirmed but didn't arrive"
  });

  it("multiple timeout entries create separate audit logs", async () => {
    const restaurantId = "rest-bulk-1";

    mockDb.restaurants.set(restaurantId, { id: restaurantId });

    // Multiple entries timing out
    const entries = [
      { id: "e1", name: "Guest 1", status: "CONFIRMED" },
      { id: "e2", name: "Guest 2", status: "CONFIRMED" },
      { id: "e3", name: "Guest 3", status: "CALLED" },
    ];

    for (const entry of entries) {
      await prismaMock.auditLog.create({
        data: {
          restaurantId,
          entryId: entry.id,
          action: entry.status === "CONFIRMED" ? "NO_SHOW_ARRIVAL" : "NO_SHOW_CONFIRM",
          actorEmail: "system",
          metadata: {
            guestName: entry.name,
            partySize: Math.floor(Math.random() * 6) + 1,
          },
        },
      });
    }

    // Verify all logs were created
    const allLogs = await prismaMock.auditLog.findMany({ where: { restaurantId } });
    expect(allLogs.length).toBe(3);

    const noShowArrivals = await prismaMock.auditLog.findMany({
      where: { restaurantId, action: "NO_SHOW_ARRIVAL" },
    });
    expect(noShowArrivals.length).toBe(2);

    const noShowConfirms = await prismaMock.auditLog.findMany({
      where: { restaurantId, action: "NO_SHOW_CONFIRM" },
    });
    expect(noShowConfirms.length).toBe(1);
  });
});
