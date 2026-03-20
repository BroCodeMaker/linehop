import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

export async function POST(request: NextRequest) {
  // NEW-010 fix: require authenticated session before writing audit logs
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { restaurantId, entryId, action, actorEmail, metadata } = body;

    if (!restaurantId || !action) {
      return NextResponse.json({ error: "restaurantId and action required" }, { status: 400 });
    }

    await prisma.auditLog.create({
      data: {
        restaurantId,
        entryId: entryId ?? null,
        action,
        actorEmail: actorEmail ?? null,
        metadata: metadata ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[audit POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
