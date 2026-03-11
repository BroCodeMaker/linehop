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
        settings: { select: { waitMinutesPerGroup: true } },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const waitMinutesPerGroup = restaurant.settings?.waitMinutesPerGroup ?? 10;

    const queueLength = await prisma.waitlistEntry.count({
      where: { restaurantId: restaurant.id, status: "WAITING" },
    });

    return NextResponse.json({
      name: restaurant.name,
      status: restaurant.status,
      listClosed: restaurant.listClosed,
      queueLength,
      estimatedWaitMinutes: (queueLength + 1) * waitMinutesPerGroup,
      waitMinutesPerGroup,
    });
  } catch (err) {
    console.error("[info]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
