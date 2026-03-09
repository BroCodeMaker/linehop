import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { confirmEntry } from "@/lib/queue";
import { emitUpdate } from "@/lib/emitter";

export async function POST(
  _req: Request,
  context: { params: Promise<{ publicToken: string }> }
) {
  try {
    const { publicToken } = await context.params;
    const entry = await prisma.waitlistEntry.findUnique({ where: { publicToken } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (entry.status !== "CALLED") {
      return NextResponse.json({ error: "Cannot confirm in current status" }, { status: 409 });
    }
    await confirmEntry(entry.id);
    emitUpdate(entry.restaurantId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[confirm]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
