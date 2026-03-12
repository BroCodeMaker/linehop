import { NextRequest, NextResponse } from "next/server";
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
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const entry = await callNext(id);

    if (!entry) {
      return NextResponse.json({ ok: false, message: "No WAITING entries" }, { status: 200 });
    }

    emitUpdate(id);

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("[call-next]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
