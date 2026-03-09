import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emitUpdate } from "@/lib/emitter";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await context.params;

    // Verify restaurant owns this entry
    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: entryId, restaurantId: id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Can seat from CALLED or CONFIRMED states
    if (!["CALLED", "CONFIRMED"].includes(entry.status)) {
      return NextResponse.json(
        { error: `Cannot seat from ${entry.status} state` },
        { status: 400 }
      );
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: { status: "SEATED", seatedAt: new Date() },
    });

    console.log(`[seat] Entry ${entryId} seated (was ${entry.status})`);
    emitUpdate(id);

    return NextResponse.json({ ok: true, entry: updated });
  } catch (err) {
    console.error("[seat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
