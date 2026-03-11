import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { emitUpdate } from "@/lib/emitter";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: { listClosed: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.restaurant.update({
    where: { id },
    data: { listClosed: !restaurant.listClosed },
    select: { listClosed: true },
  });

  emitUpdate(id);

  return NextResponse.json({ ok: true, listClosed: updated.listClosed });
}
