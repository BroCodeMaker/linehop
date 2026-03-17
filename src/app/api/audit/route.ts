import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
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
