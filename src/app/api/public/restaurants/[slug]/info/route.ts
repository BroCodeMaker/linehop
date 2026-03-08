import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { estimateEtaMinutes } from "@/lib/status";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, status: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const queueLength = await prisma.waitlistEntry.count({
      where: { restaurantId: restaurant.id, status: "WAITING" },
    });

    return NextResponse.json({
      name: restaurant.name,
      status: restaurant.status,
      queueLength,
      estimatedWaitMinutes: estimateEtaMinutes(queueLength + 1),
    });
  } catch (err) {
    console.error("[info]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
