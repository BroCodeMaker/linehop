import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { confirmEntry } from "@/lib/queue";
import { emitUpdate } from "@/lib/emitter";

export async function POST(
  _req: Request,
  context: { params: Promise<{ publicToken: string }> }
) {
  try {
    const { publicToken } = await context.params;
    const entry = await prisma.waitlistEntry.findUnique({ where: { publicToken } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Quick pre-check for a friendly error message (non-atomic, but harmless)
    if (!["CALLED", "CONFIRMED"].includes(entry.status)) {
      return NextResponse.json({ error: "Cannot confirm in current status" }, { status: 409 });
    }

    // Atomic update: only succeeds if status is still CALLED in DB.
    // Prevents race condition where expiry job ran between our read and write.
    const result = await confirmEntry(entry.id, entry.restaurantId);
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Confirmation window has expired" },
        { status: 409 }
      );
    }

    emitUpdate(entry.restaurantId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[confirm]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
