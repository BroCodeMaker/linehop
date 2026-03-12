import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { closeRestaurant } from "@/lib/queue";
import { emitUpdate } from "@/lib/emitter";
import { verifySession } from "@/lib/session";

const VALID = ["OPEN", "FULL", "PAUSED", "CLOSED"];

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const { status } = await req.json();

    if (!VALID.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "CLOSED") {
      await closeRestaurant(id);
      emitUpdate(id);
      return NextResponse.json({ ok: true, status: "CLOSED" });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    emitUpdate(id);

    return NextResponse.json({ ok: true, status: restaurant.status });
  } catch (err) {
    console.error("[status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
