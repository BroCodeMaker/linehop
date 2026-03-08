import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { confirmEntry } from "@/lib/queue";

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
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[confirm]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
