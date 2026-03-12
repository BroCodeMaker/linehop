import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { callNext } from "@/lib/queue";
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

    // Verify restaurant owns this entry
    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: entryId, restaurantId: id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Can skip from CALLED or CONFIRMED states
    if (!["CALLED", "CONFIRMED"].includes(entry.status)) {
      return NextResponse.json(
        { error: `Cannot skip from ${entry.status} state` },
        { status: 400 }
      );
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: { status: "SKIPPED", skippedAt: new Date() },
    });

    console.log(`[skip] Entry ${entryId} skipped (was ${entry.status}), calling next...`);

    // Automatically call next after skip
    await callNext(id);
    emitUpdate(id);

    return NextResponse.json({ ok: true, entry: updated, message: "Next guest called" });
  } catch (err) {
    console.error("[skip]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
