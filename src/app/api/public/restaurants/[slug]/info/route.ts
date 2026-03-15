import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        listClosed: true,
        settings: { select: { waitMinutesPerGroup: true, estimatedTableTimeMin: true, useCalculatedAvgTime: true, maxPartySize: true } },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const waitMinutesPerGroup = restaurant.settings?.waitMinutesPerGroup ?? 10;
    const estimatedTableTimeMin = restaurant.settings?.estimatedTableTimeMin ?? 15;
    const useCalculatedAvgTime = restaurant.settings?.useCalculatedAvgTime ?? false;

    let effectiveTableTimeMin = estimatedTableTimeMin;

    if (useCalculatedAvgTime) {
      const seatedEntries = await prisma.waitlistEntry.findMany({
        where: {
          restaurantId: restaurant.id,
          status: "SEATED",
          seatedAt: { not: null },
          phoneE164: { not: "+00000000000" },
        },
        select: { createdAt: true, seatedAt: true },
      });
      if (seatedEntries.length > 0) {
        const totalMs = seatedEntries.reduce(
          (sum, e) => sum + (e.seatedAt!.getTime() - e.createdAt.getTime()),
          0
        );
        effectiveTableTimeMin = Math.round(totalMs / seatedEntries.length / 60000);
      }
    }

    const queueLength = await prisma.waitlistEntry.count({
      where: { restaurantId: restaurant.id, status: "WAITING" },
    });

    return NextResponse.json({
      name: restaurant.name,
      status: restaurant.status,
      listClosed: restaurant.listClosed,
      queueLength,
      estimatedWaitMinutes: (queueLength + 1) * effectiveTableTimeMin,
      waitMinutesPerGroup,
      maxPartySize: restaurant.settings?.maxPartySize ?? 10,
    });
  } catch (err) {
    console.error("[info]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
