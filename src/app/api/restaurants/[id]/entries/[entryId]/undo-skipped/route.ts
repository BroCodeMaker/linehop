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

    if (entry.status !== "SKIPPED") {
      return NextResponse.json(
        { error: `Cannot undo-skipped from ${entry.status} state` },
        { status: 400 }
      );
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: "WAITING",
        skippedAt: null,
      },
    });

    console.log(`[undo-skipped] Entry ${entryId} reverted from SKIPPED to WAITING`);
    emitUpdate(id);

    return NextResponse.json({ ok: true, entry: updated });
  } catch (err) {
    console.error("[undo-skipped]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
