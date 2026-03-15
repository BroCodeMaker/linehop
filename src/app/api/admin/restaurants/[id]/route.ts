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

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { settings: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      restaurantId: id,
      status: { in: ["WAITING", "CALLED", "CONFIRMED"] },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      guestName: true,
      partySize: true,
      phoneE164: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ...restaurant, entries });
}
