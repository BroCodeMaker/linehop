import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { getPositionInQueue } from "@/lib/status";
import { emitUpdate } from "@/lib/emitter";

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

    // Check restaurant-specific maxPartySize
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id },
      select: { maxPartySize: true, maxQueueSize: true },
    });
    const maxPartySize = settings?.maxPartySize ?? 10;
    if (partySize > maxPartySize) {
      return NextResponse.json({
        error: `Numărul maxim de persoane permis este ${maxPartySize}.`,
        maxPartySize,
      }, { status: 400 });
    }

    // Check maxQueueSize
    const maxQueueSize = settings?.maxQueueSize ?? 50;
    const currentQueueSize = await prisma.waitlistEntry.count({
      where: { restaurantId: restaurant.id, status: "WAITING" },
    });
    if (currentQueueSize >= maxQueueSize) {
      return NextResponse.json({
        error: "Lista de așteptare este plină. Vă rugăm să încercați mai târziu.",
        queueFull: true,
      }, { status: 409 });
    }

    const phoneE164 = normalizePhone(phone);

    // Feature 8: Block same phone with ANY status (already in waitlist or participated)
    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        restaurantId: restaurant.id,
        phoneE164,
      },
    });
    if (existing) {
      return NextResponse.json({
        error: "Acest număr de telefon este deja înregistrat sau a participat la lista de așteptare.",
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

    emitUpdate(restaurant.id);

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
