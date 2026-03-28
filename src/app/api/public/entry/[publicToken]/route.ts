import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPositionInQueue } from "@/lib/status";

export async function GET(
  _request: Request,
  context: { params: Promise<{ publicToken: string }> }
) {
  try {
    const { publicToken } = await context.params;

    const entry = await prisma.waitlistEntry.findUnique({
      where: { publicToken },
      include: { restaurant: { include: { settings: { select: { maxPartySize: true } } } } },
    });

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let position: number | null = null;
    if (entry.status === "WAITING") {
      // +1 converts 0-indexed count-before to 1-indexed position
      position = (await getPositionInQueue(entry.restaurantId, entry.createdAt)) + 1;
    }

    return NextResponse.json({
      publicToken: entry.publicToken,
      status: entry.status,
      partySize: entry.partySize,
      guestName: entry.guestName,
      restaurantName: entry.restaurant.name,
      restaurantSlug: entry.restaurant.slug,
      maxPartySize: entry.restaurant.settings?.maxPartySize ?? 10,
      position,
      calledAt: entry.calledAt,
      confirmedAt: entry.confirmedAt,
      seatedAt: entry.seatedAt,
      createdAt: entry.createdAt,
      confirmDeadlineAt: entry.confirmDeadlineAt,
      arrivalDeadlineAt: entry.arrivalDeadlineAt,
    });
  } catch (err) {
    console.error("[entry]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
