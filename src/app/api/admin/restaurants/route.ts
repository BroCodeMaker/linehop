import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get("superadmin_session")?.value;
  if (!token) return false;
  const payload = verifySession(token);
  return payload?.role === "superadmin";
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          entries: {
            where: { createdAt: { gte: today } },
          },
        },
      },
    },
  });

  return NextResponse.json(
    restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      status: r.status,
      createdAt: r.createdAt,
      entriesToday: r._count.entries,
    }))
  );
}
