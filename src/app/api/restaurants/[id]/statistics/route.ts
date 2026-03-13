import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "all":
    default:
      return null;
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const period = req.nextUrl.searchParams.get("period") ?? "all";
    const periodStart = getPeriodStart(period);

    const dateFilter = periodStart ? { gte: periodStart } : undefined;
    const where = {
      restaurantId: id,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    };

    // 1. Total entries created (joined list)
    const totalJoined = await prisma.waitlistEntry.count({ where });

    // 2. Entries that confirmed (reached CONFIRMED or SEATED with confirmedAt set)
    const totalConfirmed = await prisma.waitlistEntry.count({
      where: {
        ...where,
        confirmedAt: { not: null },
      },
    });

    // 3. No-shows
    const totalNoShows = await prisma.waitlistEntry.count({
      where: {
        ...where,
        status: { in: ["NO_SHOW_CONFIRM", "NO_SHOW_ARRIVAL"] },
      },
    });

    // 4. Groups seated
    const totalSeated = await prisma.waitlistEntry.count({
      where: { ...where, status: "SEATED" },
    });

    // 5. Total people seated (sum partySize where SEATED)
    const seatedEntries = await prisma.waitlistEntry.findMany({
      where: { ...where, status: "SEATED" },
      select: { partySize: true, createdAt: true, seatedAt: true, phoneE164: true },
    });
    const totalPeopleSeated = seatedEntries.reduce((sum, e) => sum + e.partySize, 0);

    // 6. Average wait time (join → seated, exclude walk-ins)
    const seatedWithTimes = seatedEntries.filter(
      e => e.seatedAt && e.phoneE164 !== "+00000000000"
    );
    let avgWaitMinutes: number | null = null;
    if (seatedWithTimes.length > 0) {
      const totalMs = seatedWithTimes.reduce(
        (sum, e) => sum + (e.seatedAt!.getTime() - e.createdAt.getTime()),
        0
      );
      avgWaitMinutes = Math.round(totalMs / seatedWithTimes.length / 60000);
    }

    // 7. Groups called from list (calledAt set, not manual/walk-in)
    const calledFromList = await prisma.waitlistEntry.count({
      where: {
        ...where,
        calledAt: { not: null },
        phoneE164: { not: "+00000000000" },
      },
    });

    // 8. Groups added manually (phoneE164 = +00000000000 but status WAITING, or no calledAt)
    // Walk-in: seatedAt = createdAt (same timestamp), phoneE164 = +00000000000
    // Manual: phoneE164 = +00000000000 but not immediately SEATED, OR any non-phone entry
    // Distinguish: walk-ins have status=SEATED and seatedAt≈createdAt; manual adds have status=WAITING initially
    // Simpler: manual = entries created with guestName != 'Walk-in' AND no public phone
    // Walk-in: guestName = 'Walk-in'
    const addedManually = await prisma.waitlistEntry.count({
      where: {
        ...where,
        guestName: { not: "Walk-in" },
        phoneE164: "+00000000000",
      },
    });

    const walkIns = await prisma.waitlistEntry.count({
      where: {
        ...where,
        guestName: "Walk-in",
        phoneE164: "+00000000000",
      },
    });

    return NextResponse.json({
      ok: true,
      period,
      totalJoined,
      totalConfirmed,
      totalNoShows,
      totalSeated,
      totalPeopleSeated,
      avgWaitMinutes,
      calledFromList,
      addedManually,
      walkIns,
    });
  } catch (err) {
    console.error("[statistics]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
