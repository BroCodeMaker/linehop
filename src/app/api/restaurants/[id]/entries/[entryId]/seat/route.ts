import { NextRequest, NextResponse } from "next/server";
import { seatEntry } from "@/lib/queue";
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

    // seatEntry validates state (CALLED/CONFIRMED only) + clears reminder timer
    const result = await seatEntry(id, entryId);
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Entry not found or not in a seatable state (CALLED/CONFIRMED)" },
        { status: 404 }
      );
    }

    console.log(`[seat] Entry ${entryId} seated`);
    emitUpdate(id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[seat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
