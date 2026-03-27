/**
 * LH-005 GDPR Compliance Tests
 *
 * Tests:
 * 1. Delete-data endpoint: 401 without token
 * 2. Delete-data endpoint: deletes entries for phone number
 * 3. Join API: saves gdprConsent=true and gdprConsentAt when provided
 * 4. Join API: defaults gdprConsent=false when not provided
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mocks (hoisted) ----
const { mockDb, prismaMock } = vi.hoisted(() => {
  const mockDb: {
    entries: Map<string, Record<string, unknown>>;
    restaurants: Map<string, Record<string, unknown>>;
    restaurantSettings: Map<string, Record<string, unknown>>;
    messageEvents: Map<string, Record<string, unknown>>;
  } = {
    entries: new Map(),
    restaurants: new Map(),
    restaurantSettings: new Map(),
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
    },
    restaurantSettings: {
      findUnique: vi.fn(({ where }: { where: { restaurantId: string } }) =>
        Promise.resolve(mockDb.restaurantSettings.get(where.restaurantId) ?? null)
      ),
    },
    waitlistEntry: {
      findFirst: vi.fn(({ where }: { where: Record<string, unknown> }) => {
        for (const e of mockDb.entries.values()) {
          const entry = e as Record<string, unknown>;
          let match = true;
          if (where.restaurantId && entry.restaurantId !== where.restaurantId) match = false;
          if (where.phoneE164 && entry.phoneE164 !== where.phoneE164) match = false;
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
          if (where.status && entry.status !== where.status) match = false;
          if (match) results.push(entry);
        }
        return Promise.resolve(results);
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
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        const entry = {
          id: `entry-${Date.now()}`,
          createdAt: new Date(),
          gdprConsent: false,
          gdprConsentAt: null,
          ...data,
        };
        mockDb.entries.set(entry.id as string, entry);
        return Promise.resolve(entry);
      }),
      deleteMany: vi.fn(({ where }: { where: { phoneE164: string } }) => {
        let count = 0;
        for (const [id, e] of mockDb.entries.entries()) {
          if ((e as { phoneE164: string }).phoneE164 === where.phoneE164) {
            mockDb.entries.delete(id);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },
  };

  return { mockDb, prismaMock };
});

vi.mock("@/lib/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/emitter", () => ({ emitUpdate: vi.fn() }));

import { POST as deleteDataPOST } from "@/app/api/user/delete-data/route";
import { POST as joinPOST } from "@/app/api/public/restaurants/[slug]/join/route";

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// ---- Delete-data endpoint tests ----
describe("DELETE /api/user/delete-data", () => {
  beforeEach(() => {
    mockDb.entries.clear();
    vi.stubEnv("DATA_DELETE_TOKEN", "test-token-abc");
  });

  it("returns 401 when X-Delete-Token header is missing", async () => {
    const req = makeRequest({ phone: "0712345678" });
    const res = await deleteDataPOST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 when X-Delete-Token is wrong", async () => {
    const req = makeRequest({ phone: "0712345678" }, { "X-Delete-Token": "wrong-token" });
    const res = await deleteDataPOST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(401);
  });

  it("deletes entries for the given phone and returns count", async () => {
    // Seed 2 entries with the same phone
    mockDb.entries.set("e1", { id: "e1", phoneE164: "+40712345678", restaurantId: "r1", status: "WAITING" });
    mockDb.entries.set("e2", { id: "e2", phoneE164: "+40712345678", restaurantId: "r2", status: "SEATED" });
    mockDb.entries.set("e3", { id: "e3", phoneE164: "+40799999999", restaurantId: "r1", status: "WAITING" });

    const req = makeRequest({ phone: "0712345678" }, { "X-Delete-Token": "test-token-abc" });
    const res = await deleteDataPOST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.deleted).toBe(2);
    // The unrelated entry should still exist
    expect(mockDb.entries.has("e3")).toBe(true);
  });

  it("returns 400 for invalid body", async () => {
    const req = makeRequest({ notPhone: "bad" }, { "X-Delete-Token": "test-token-abc" });
    const res = await deleteDataPOST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });
});

// ---- Join API: GDPR consent tests ----
describe("POST /api/public/restaurants/[slug]/join — GDPR consent", () => {
  const restaurantId = "rest-gdpr-test";

  beforeEach(() => {
    mockDb.entries.clear();
    mockDb.restaurants.clear();
    mockDb.restaurantSettings.clear();

    mockDb.restaurants.set(restaurantId, {
      id: restaurantId,
      slug: "test-restaurant",
      name: "Test",
      status: "FULL",
      listClosed: false,
    });
    mockDb.restaurantSettings.set(restaurantId, {
      maxPartySize: 10,
      maxQueueSize: 50,
    });
  });

  it("saves gdprConsent=true and gdprConsentAt when consent is given", async () => {
    const req = makeRequest({ partySize: 2, phone: "0712000001", gdprConsent: true });
    const res = await joinPOST(
      req as unknown as import("next/server").NextRequest,
      { params: Promise.resolve({ slug: "test-restaurant" }) }
    );
    expect(res.status).toBe(200);

    const createdEntry = Array.from(mockDb.entries.values())[0] as Record<string, unknown>;
    expect(createdEntry.gdprConsent).toBe(true);
    expect(createdEntry.gdprConsentAt).toBeInstanceOf(Date);
  });

  it("saves gdprConsent=false and gdprConsentAt=null when consent is not given", async () => {
    const req = makeRequest({ partySize: 2, phone: "0712000002" });
    const res = await joinPOST(
      req as unknown as import("next/server").NextRequest,
      { params: Promise.resolve({ slug: "test-restaurant" }) }
    );
    expect(res.status).toBe(200);

    const createdEntry = Array.from(mockDb.entries.values())[0] as Record<string, unknown>;
    expect(createdEntry.gdprConsent).toBe(false);
    expect(createdEntry.gdprConsentAt).toBeNull();
  });
});
