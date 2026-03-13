import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
        { error: `Cannot undo-seated from ${entry.status} state` },
        { status: 400 }
      );
    }

    // Revert to CALLED if calledAt exists, otherwise WAITING
    const revertStatus = entry.calledAt ? "CALLED" : "WAITING";

    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: revertStatus,
        seatedAt: null,
      },
    });

    console.log(`[undo-seated] Entry ${entryId} reverted from SEATED to ${revertStatus}`);
    emitUpdate(id);

    return NextResponse.json({ ok: true, entry: updated, revertedTo: revertStatus });
  } catch (err) {
    console.error("[undo-seated]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
