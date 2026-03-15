import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get("superadmin_session")?.value;
  if (!token) return false;
  const payload = verifySession(token);
  return payload?.role === "superadmin";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const qrToken = await prisma.qrToken.findUnique({
    where: { id },
    include: { restaurant: { select: { id: true, name: true, slug: true } } },
  });

  if (!qrToken) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  let entriesData = null;
  let errorLogs: unknown[] = [];

  if (qrToken.restaurantId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayEntries, recentErrors] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where: {
          restaurantId: qrToken.restaurantId,
          createdAt: { gte: today },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          guestName: true,
          partySize: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.errorLog.findMany({
        where: { restaurantId: qrToken.restaurantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          subject: true,
          description: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const todayCount = todayEntries.filter((e) =>
      ["WAITING", "CALLED", "CONFIRMED", "SEATED"].includes(e.status)
    ).length;

    const activeEntries = todayEntries
      .filter((e) => ["WAITING", "CALLED", "CONFIRMED"].includes(e.status))
      .slice(0, 10);

    entriesData = { todayCount, activeEntries };
    errorLogs = recentErrors;
  }

  return NextResponse.json({ ...qrToken, entriesData, errorLogs });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const qrToken = await prisma.qrToken.findUnique({ where: { id } });
  if (!qrToken) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  await prisma.qrToken.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
