/**
 * No-Show Audit Log Tests
 * 
 * Tests that when entries timeout (CALLED → NO_SHOW_CONFIRM or CONFIRMED → NO_SHOW_ARRIVAL),
 * an audit log entry is created so the history page displays correctly.
 * 
 * Ticket: LH-001 — Confirmed → No-Show Timeout: history not showing correct status
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, prismaMock } = vi.hoisted(() => {
  const mockDb: {
    entries: Map<string, Record<string, unknown>>;
    auditLogs: Array<Record<string, unknown>>;
  } = {
    entries: new Map(),
    auditLogs: [],
  };

  const prismaMock = {
    waitlistEntry: {
      findFirst: vi.fn(({ where }: { where: { id: string; restaurantId: string } }) => {
        const entry = mockDb.entries.get(where.id);
        if (!entry || entry.restaurantId !== where.restaurantId) return Promise.resolve(null);
        return Promise.resolve(entry);
      }),
      update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const entry = mockDb.entries.get(where.id);
        if (!entry) return Promise.resolve(null);
        const updated = { ...entry, ...data };
        mockDb.entries.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    auditLog: {
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const log = { id: `log-${mockDb.auditLogs.length + 1}`, ...data, createdAt: new Date() };
        mockDb.auditLogs.push(log);
        return Promise.resolve(log);
      }),
      findMany: vi.fn(({ where }: { where: { restaurantId: string } }) => {
        return Promise.resolve(
          mockDb.auditLogs.filter((l) => l.restaurantId === where.restaurantId)
        );
      }),
    },
  };

  return { mockDb, prismaMock };
});

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/emitter", () => ({ emitUpdate: vi.fn() }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn(() => ({ userId: "test" })),
}));

import { POST } from "@/app/api/restaurants/[id]/entries/[entryId]/no-show/route";
import { NextRequest } from "next/server";

function makeRequest(cookieSession = "valid-token") {
  const req = new NextRequest("http://localhost/api/test", {
    method: "POST",
    headers: { Cookie: `session=${cookieSession}` },
  });
  return req;
}

function makeContext(id: string, entryId: string) {
  return { params: Promise.resolve({ id, entryId }) };
}

beforeEach(() => {
  mockDb.entries.clear();
  mockDb.auditLogs.length = 0;
  vi.clearAllMocks();
});

describe("No-show audit log — CALLED → NO_SHOW_CONFIRM", () => {
  it("creates audit log when confirm deadline has expired", async () => {
    const expired = new Date(Date.now() - 60_000); // 1 min ago
    mockDb.entries.set("entry-1", {
      id: "entry-1",
      restaurantId: "rest-1",
      status: "CALLED",
      confirmDeadlineAt: expired,
      arrivalDeadlineAt: null,
      guestName: "Ion Popescu",
      partySize: 2,
    });

    const res = await POST(makeRequest(), makeContext("rest-1", "entry-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.entry.status).toBe("NO_SHOW_CONFIRM");

    // ✅ Audit log must be created
    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce();
    const logCall = prismaMock.auditLog.create.mock.calls[0][0].data;
    expect(logCall.action).toBe("NO_SHOW_CONFIRM");
    expect(logCall.actorEmail).toBe("system");
    expect((logCall.metadata as Record<string, unknown>).reason).toBe("confirm_timeout");
    expect((logCall.metadata as Record<string, unknown>).previousStatus).toBe("CALLED");
    expect((logCall.metadata as Record<string, unknown>).newStatus).toBe("NO_SHOW_CONFIRM");
    expect((logCall.metadata as Record<string, unknown>).guestName).toBe("Ion Popescu");
  });

  it("does NOT create audit log if deadline has not yet passed", async () => {
    const future = new Date(Date.now() + 60_000); // 1 min in future
    mockDb.entries.set("entry-2", {
      id: "entry-2",
      restaurantId: "rest-1",
      status: "CALLED",
      confirmDeadlineAt: future,
      arrivalDeadlineAt: null,
      guestName: "Test User",
      partySize: 1,
    });

    const res = await POST(makeRequest(), makeContext("rest-1", "entry-2"));

    expect(res.status).toBe(400);
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("No-show audit log — CONFIRMED → NO_SHOW_ARRIVAL (main bug)", () => {
  it("creates audit log when arrival deadline has expired", async () => {
    const expired = new Date(Date.now() - 60_000); // 1 min ago
    mockDb.entries.set("entry-3", {
      id: "entry-3",
      restaurantId: "rest-1",
      status: "CONFIRMED",
      confirmDeadlineAt: null,
      arrivalDeadlineAt: expired,
      guestName: "Maria Ionescu",
      partySize: 4,
    });

    const res = await POST(makeRequest(), makeContext("rest-1", "entry-3"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.entry.status).toBe("NO_SHOW_ARRIVAL");

    // ✅ Audit log must be created (this was the BUG — it wasn't)
    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce();
    const logCall = prismaMock.auditLog.create.mock.calls[0][0].data;
    expect(logCall.action).toBe("NO_SHOW_ARRIVAL");
    expect(logCall.actorEmail).toBe("system");
    expect((logCall.metadata as Record<string, unknown>).reason).toBe("arrival_timeout");
    expect((logCall.metadata as Record<string, unknown>).previousStatus).toBe("CONFIRMED");
    expect((logCall.metadata as Record<string, unknown>).newStatus).toBe("NO_SHOW_ARRIVAL");
    expect((logCall.metadata as Record<string, unknown>).guestName).toBe("Maria Ionescu");
  });

  it("does NOT create audit log if arrival deadline has not yet passed", async () => {
    const future = new Date(Date.now() + 60_000);
    mockDb.entries.set("entry-4", {
      id: "entry-4",
      restaurantId: "rest-1",
      status: "CONFIRMED",
      confirmDeadlineAt: null,
      arrivalDeadlineAt: future,
      guestName: "Test User",
      partySize: 2,
    });

    const res = await POST(makeRequest(), makeContext("rest-1", "entry-4"));

    expect(res.status).toBe(400);
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it("audit log appears in history query after NO_SHOW_ARRIVAL", async () => {
    const expired = new Date(Date.now() - 60_000);
    mockDb.entries.set("entry-5", {
      id: "entry-5",
      restaurantId: "rest-1",
      status: "CONFIRMED",
      confirmDeadlineAt: null,
      arrivalDeadlineAt: expired,
      guestName: "Gelu Test",
      partySize: 3,
    });

    await POST(makeRequest(), makeContext("rest-1", "entry-5"));

    // Simulate history page query
    const logs = await prismaMock.auditLog.findMany({ where: { restaurantId: "rest-1" } });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("NO_SHOW_ARRIVAL");
    expect((logs[0].metadata as Record<string, unknown>).reason).toBe("arrival_timeout");
  });
});
