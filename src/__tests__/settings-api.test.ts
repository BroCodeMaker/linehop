/**
 * LH-006: Settings API Tests
 * Tests GET/PUT /api/restaurants/[id]/settings
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── vi.hoisted mock DB ────────────────────────────────────────────────────────
const { mockDb, prismaMock } = vi.hoisted(() => {
  const mockDb: {
    restaurantSettings: Map<string, Record<string, unknown>>;
  } = {
    restaurantSettings: new Map(),
  };

  const prismaMock = {
    restaurantSettings: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  };

  return { mockDb, prismaMock };
});

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({ default: prismaMock, prisma: prismaMock }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn(() => ({ restaurantId: "rest-1", email: "admin@test.com" })),
  signSession: vi.fn(() => "valid-test-token"),
}));

// ── Import route handlers after mocks ─────────────────────────────────────────
import { GET, PUT } from "@/app/api/restaurants/[id]/settings/route";

// ── Default settings factory ──────────────────────────────────────────────────
function makeDefaultSettings(restaurantId: string, overrides: Record<string, unknown> = {}) {
  return {
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
    msgWhatsappCall: "Masa e gata!",
    msgWhatsappExpire: "Locul a expirat.",
    msgWhatsappCallAgain: "O nouă șansă.",
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeAuthRequest(
  url: string,
  method: "GET" | "PUT",
  body?: Record<string, unknown>
): NextRequest {
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: "session=valid-test-token",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return new NextRequest(url, opts);
}

// ── beforeEach ────────────────────────────────────────────────────────────────
beforeEach(() => {
  mockDb.restaurantSettings.clear();
  vi.clearAllMocks();

  prismaMock.restaurantSettings.findUnique.mockImplementation(
    ({ where }: { where: { restaurantId: string } }) =>
      Promise.resolve(mockDb.restaurantSettings.get(where.restaurantId) ?? null)
  );

  prismaMock.restaurantSettings.create.mockImplementation(
    ({ data }: { data: Record<string, unknown> }) => {
      const s = makeDefaultSettings(data.restaurantId as string, data);
      mockDb.restaurantSettings.set(data.restaurantId as string, s);
      return Promise.resolve(s);
    }
  );

  prismaMock.restaurantSettings.upsert.mockImplementation(
    ({ where, update, create }: {
      where: { restaurantId: string };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => {
      const existing = mockDb.restaurantSettings.get(where.restaurantId);
      if (existing) {
        // Only apply defined values (strip undefined)
        const patch = Object.fromEntries(
          Object.entries(update).filter(([, v]) => v !== undefined)
        );
        Object.assign(existing, patch, { updatedAt: new Date() });
        return Promise.resolve(existing);
      }
      const s = makeDefaultSettings(where.restaurantId, create);
      mockDb.restaurantSettings.set(where.restaurantId, s);
      return Promise.resolve(s);
    }
  );
});

const RESTAURANT_ID = "rest-test-001";

function makeCtx(id = RESTAURANT_ID) {
  return { params: Promise.resolve({ id }) };
}

// =============================================================================
// GET /api/restaurants/[id]/settings
// =============================================================================
describe("GET /api/restaurants/[id]/settings", () => {
  it("returns existing settings from DB", async () => {
    const settings = makeDefaultSettings(RESTAURANT_ID, {
      confirmTimerSec: 90,
      maxQueueSize: 20,
    });
    mockDb.restaurantSettings.set(RESTAURANT_ID, settings);

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "GET"
    );
    const res = await GET(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.settings).toBeDefined();
    expect(body.settings.confirmTimerSec).toBe(90);
    expect(body.settings.maxQueueSize).toBe(20);
    expect(body.settings.restaurantId).toBe(RESTAURANT_ID);
  });

  it("auto-creates default settings if none exist in DB", async () => {
    // No settings seeded

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "GET"
    );
    const res = await GET(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.settings.confirmTimerSec).toBe(120); // default value
    expect(body.settings.arrivalTimerSec).toBe(300);
    expect(body.settings.maxQueueSize).toBe(5);
  });

  it("returns 401 when no session cookie", async () => {
    // isAuthed() returns false immediately when no token — verifySession never called
    const req = new NextRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      { method: "GET" } // No Cookie header
    );
    const res = await GET(req, makeCtx());

    expect(res.status).toBe(401);
  });

  it("returns all required settings fields", async () => {
    const settings = makeDefaultSettings(RESTAURANT_ID);
    mockDb.restaurantSettings.set(RESTAURANT_ID, settings);

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "GET"
    );
    const res = await GET(req, makeCtx());
    const body = await res.json();

    const s = body.settings;
    expect(s.confirmTimerSec).toBeDefined();
    expect(s.arrivalTimerSec).toBeDefined();
    expect(s.bufferVisibilitySec).toBeDefined();
    expect(s.maxCallAgain).toBeDefined();
    expect(s.maxPartySize).toBeDefined();
    expect(s.maxQueueSize).toBeDefined();
    expect(s.estimatedTableTimeMin).toBeDefined();
    expect(s.useCalculatedAvgTime).toBeDefined();
    expect(s.msgWhatsappCall).toBeDefined();
    expect(s.msgWhatsappExpire).toBeDefined();
    expect(s.msgWhatsappCallAgain).toBeDefined();
  });
});

// =============================================================================
// PUT /api/restaurants/[id]/settings — valid values
// =============================================================================
describe("PUT /api/restaurants/[id]/settings — valid values", () => {
  it("saves confirmTimerSec to DB", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { confirmTimerSec: 60 }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.settings.confirmTimerSec).toBe(60);
    // Verify persisted in mockDb
    const saved = mockDb.restaurantSettings.get(RESTAURANT_ID);
    expect((saved as Record<string, unknown>)?.confirmTimerSec).toBe(60);
  });

  it("saves arrivalTimerSec to DB", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { arrivalTimerSec: 240 }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings.arrivalTimerSec).toBe(240);
  });

  it("saves maxPartySize to DB", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { maxPartySize: 8 }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings.maxPartySize).toBe(8);
  });

  it("saves maxQueueSize = 30 to DB", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { maxQueueSize: 30 }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings.maxQueueSize).toBe(30);
  });

  it("saves WhatsApp call message to DB", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { msgWhatsappCall: "Masa dvs. e pregătită! Veniți urgent." }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings.msgWhatsappCall).toBe("Masa dvs. e pregătită! Veniți urgent.");
  });

  it("saves useCalculatedAvgTime = true to DB", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { useCalculatedAvgTime: true }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings.useCalculatedAvgTime).toBe(true);
  });

  it("saves multiple settings at once", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      {
        confirmTimerSec: 90,
        arrivalTimerSec: 180,
        maxCallAgain: 2,
        maxQueueSize: 25,
        msgWhatsappExpire: "Scuze, locul a expirat!",
      }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings.confirmTimerSec).toBe(90);
    expect(body.settings.arrivalTimerSec).toBe(180);
    expect(body.settings.maxCallAgain).toBe(2);
    expect(body.settings.maxQueueSize).toBe(25);
    expect(body.settings.msgWhatsappExpire).toBe("Scuze, locul a expirat!");
  });

  it("returns 401 when not authenticated", async () => {
    // isAuthed() returns false immediately when no cookie token
    const req = new NextRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // No Cookie header
        body: JSON.stringify({ confirmTimerSec: 60 }),
      }
    );
    const res = await PUT(req, makeCtx());

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// PUT /api/restaurants/[id]/settings — invalid values → 400
// =============================================================================
describe("PUT /api/restaurants/[id]/settings — invalid values → 400", () => {
  it("rejects maxQueueSize < 1 → 400", async () => {
    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { maxQueueSize: 0 }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("maxQueueSize");
  });

  it("rejects maxQueueSize > 50 → 400", async () => {
    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { maxQueueSize: 51 }
    );
    const res = await PUT(req, makeCtx());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("maxQueueSize");
  });

  it("rejects maxQueueSize = 0 (boundary) → 400", async () => {
    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { maxQueueSize: 0 }
    );
    const res = await PUT(req, makeCtx());

    expect(res.status).toBe(400);
  });

  it("rejects maxQueueSize = 100 → 400", async () => {
    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { maxQueueSize: 100 }
    );
    const res = await PUT(req, makeCtx());

    expect(res.status).toBe(400);
  });

  it("accepts maxQueueSize = 1 (minimum valid) → 200", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { maxQueueSize: 1 }
    );
    const res = await PUT(req, makeCtx());

    expect(res.status).toBe(200);
  });

  it("accepts maxQueueSize = 50 (maximum valid) → 200", async () => {
    mockDb.restaurantSettings.set(RESTAURANT_ID, makeDefaultSettings(RESTAURANT_ID));

    const req = makeAuthRequest(
      `http://localhost/api/restaurants/${RESTAURANT_ID}/settings`,
      "PUT",
      { maxQueueSize: 50 }
    );
    const res = await PUT(req, makeCtx());

    expect(res.status).toBe(200);
  });
});
