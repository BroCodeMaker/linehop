import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { getPositionInQueue } from "@/lib/status";

const JoinSchema = z.object({
  partySize: z.number().int().min(1).max(20),
  phone: z.string().min(6),
  guestName: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const parsed = JoinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { partySize, phone, guestName } = parsed.data;

    const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (restaurant.status !== "FULL") {
      return NextResponse.json({ error: "Waitlist not active", restaurantStatus: restaurant.status }, { status: 409 });
    }

    const phoneE164 = normalizePhone(phone);

    // Block phone if it expired at this restaurant today (last 16h = same evening)
    const recentExpiry = await prisma.waitlistEntry.findFirst({
      where: {
        restaurantId: restaurant.id,
        phoneE164,
        status: 'EXPIRED',
        expiredAt: { gte: new Date(Date.now() - 16 * 60 * 60 * 1000) },
      },
    });
    if (recentExpiry) {
      return NextResponse.json({
        error: "Numărul tău a expirat din lista de așteptare în această seară. Te rugăm să revii mâine sau să contactezi personalul restaurantului.",
        blocked: true,
      }, { status: 409 });
    }

    const publicToken = crypto.randomUUID();
    const now = new Date();

    const entry = await prisma.waitlistEntry.create({
      data: {
        restaurantId: restaurant.id,
        publicToken,
        partySize,
        phoneE164,
        guestName: guestName ?? null,
        status: "WAITING",
        createdAt: now,
      },
    });

    const position = await getPositionInQueue(restaurant.id, entry.createdAt);
    const queueLength = await prisma.waitlistEntry.count({
      where: { restaurantId: restaurant.id, status: "WAITING" },
    });

    return NextResponse.json({
      ok: true,
      publicToken,
      statusUrl: `/s/${publicToken}`,
      position: position + 1,
      queueLength,
    });
  } catch (err) {
    console.error("[join]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
