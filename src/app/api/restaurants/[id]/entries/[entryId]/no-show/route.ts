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

    if (entry.status !== "CALLED") {
      return NextResponse.json(
        { error: `Entry is not in CALLED status (current: ${entry.status})` },
        { status: 400 }
      );
    }

    const now = new Date();
    if (!entry.confirmDeadlineAt || entry.confirmDeadlineAt > now) {
      return NextResponse.json(
        { error: "Confirm deadline has not passed yet" },
        { status: 400 }
      );
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: "NO_SHOW_CONFIRM",
        expiredAt: now,
        expiredReason: "NO_SHOW_CONFIRM",
      },
    });

    emitUpdate(id);

    return NextResponse.json({ ok: true, entry: updated });
  } catch (err) {
    console.error("[no-show]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
