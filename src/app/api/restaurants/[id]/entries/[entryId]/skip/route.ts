import { NextRequest, NextResponse } from "next/server";
import { skipEntry } from "@/lib/queue";
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

    // skipEntry validates ownership + clears reminder timer atomically
    const result = await skipEntry(id, entryId);
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Entry not found or not in a skippable state (WAITING/CALLED/CONFIRMED)" },
        { status: 404 }
      );
    }

    emitUpdate(id);

    return NextResponse.json({ ok: true, message: "Entry skipped" });
  } catch (err) {
    console.error("[skip]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
