import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: entryId, restaurantId: id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const now = new Date();

    // CALLED → NO_SHOW_CONFIRM (client didn't confirm arrival in time)
    if (entry.status === "CALLED") {
      if (!entry.confirmDeadlineAt || entry.confirmDeadlineAt > now) {
        return NextResponse.json(
          { error: "Confirm deadline has not passed yet" },
          { status: 400 }
        );
      }

      const updated = await prisma.waitlistEntry.update({
        where: { id: entryId },
        data: {
          status: "NO_SHOW_CONFIRM",
          expiredAt: now,
          expiredReason: "NO_SHOW_CONFIRM",
        },
      });

      // Audit log: CALLED → NO_SHOW_CONFIRM
      await prisma.auditLog.create({
        data: {
          restaurantId: id,
          entryId: entryId,
          action: "NO_SHOW_CONFIRM",
          actorEmail: "system",
          metadata: {
            reason: "confirm_timeout",
            previousStatus: "CALLED",
            newStatus: "NO_SHOW_CONFIRM",
            guestName: entry.guestName,
            partySize: entry.partySize,
          },
        },
      }).catch((err: unknown) => console.error("[no-show] audit log failed:", err));

      emitUpdate(id);
      return NextResponse.json({ ok: true, entry: updated });
    }

    // CONFIRMED → NO_SHOW_ARRIVAL (client confirmed but didn't arrive in time)
    if (entry.status === "CONFIRMED") {
      if (!entry.arrivalDeadlineAt || entry.arrivalDeadlineAt > now) {
        return NextResponse.json(
          { error: "Arrival deadline has not passed yet" },
          { status: 400 }
        );
      }

      const updated = await prisma.waitlistEntry.update({
        where: { id: entryId },
        data: {
          status: "NO_SHOW_ARRIVAL",
          expiredAt: now,
          expiredReason: "NO_SHOW_ARRIVAL",
        },
      });

      // Audit log: CONFIRMED → NO_SHOW_ARRIVAL
      await prisma.auditLog.create({
        data: {
          restaurantId: id,
          entryId: entryId,
          action: "NO_SHOW_ARRIVAL",
          actorEmail: "system",
          metadata: {
            reason: "arrival_timeout",
            previousStatus: "CONFIRMED",
            newStatus: "NO_SHOW_ARRIVAL",
            guestName: entry.guestName,
            partySize: entry.partySize,
          },
        },
      }).catch((err: unknown) => console.error("[no-show] audit log failed:", err));

      emitUpdate(id);
      return NextResponse.json({ ok: true, entry: updated });
    }

    return NextResponse.json(
      { error: `Entry status '${entry.status}' cannot be expired` },
      { status: 400 }
    );
  } catch (err) {
    console.error("[no-show]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
