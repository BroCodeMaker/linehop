import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendCallNotification, getRestaurantSettings } from "@/lib/queue";
import { emitUpdate } from "@/lib/emitter";
import { verifySession } from "@/lib/session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, entryId } = await context.params;

    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: entryId, restaurantId: id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (entry.status !== "SEATED") {
      return NextResponse.json(
        { error: `Re-call only available for SEATED entries, current: ${entry.status}` },
        { status: 400 }
      );
    }

    const settings = await getRestaurantSettings(id);
    const now = new Date();
    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: "CALLED",
        seatedAt: null,
        calledAt: now,
        confirmedAt: null,
        confirmDeadlineAt: new Date(now.getTime() + settings.confirmTimerSec * 1000),
        arrivalDeadlineAt: null,
      },
    });

    // FIX: send WhatsApp notification + schedule 60s reminder
    await sendCallNotification(updated);

    console.log(`[re-call] Entry ${entryId} re-called from SEATED`);
    emitUpdate(id);

    return NextResponse.json({ ok: true, entry: updated });
  } catch (err) {
    console.error("[re-call]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
