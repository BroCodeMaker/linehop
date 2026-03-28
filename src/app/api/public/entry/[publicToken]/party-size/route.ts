import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ publicToken: string }> }
) {
  try {
    const { publicToken } = await context.params;
    const { partySize } = await request.json();

    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      return NextResponse.json({ error: "Invalid partySize" }, { status: 400 });
    }

    const entry = await prisma.waitlistEntry.findUnique({
      where: { publicToken },
      include: { restaurant: { include: { settings: { select: { maxPartySize: true } } } } },
    });

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Permite editare doar dacă e WAITING
    if (entry.status !== "WAITING") {
      return NextResponse.json({ error: "Cannot edit party size in current status" }, { status: 400 });
    }

    const maxPartySize = entry.restaurant.settings?.maxPartySize ?? 10;
    if (partySize > maxPartySize) {
      return NextResponse.json({ error: "Exceeds max party size" }, { status: 400 });
    }

    await prisma.waitlistEntry.update({
      where: { publicToken },
      data: { partySize },
    });

    return NextResponse.json({ success: true, partySize });
  } catch (err) {
    console.error("[party-size]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
