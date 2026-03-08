import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ publicToken: string }> }
) {
  try {
    const { publicToken } = await context.params;

    const entry = await prisma.waitlistEntry.findUnique({
      where: { publicToken },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Can only cancel if not already seated/skipped/expired/canceled
    const cancelableStatuses = ["WAITING", "CALLED", "CONFIRMED"];
    if (!cancelableStatuses.includes(entry.status)) {
      return NextResponse.json(
        { error: `Cannot cancel from ${entry.status} state` },
        { status: 400 }
      );
    }

    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, status: "CANCELED" });
  } catch (err) {
    console.error("[cancel]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
