import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get("superadmin_session")?.value;
  if (!token) return false;
  const payload = verifySession(token);
  return payload?.role === "superadmin";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { restaurantId } = await req.json();

  const updated = await prisma.qrToken.update({
    where: { id: params.id },
    data: {
      restaurantId: restaurantId || null,
      status: restaurantId ? "claimed" : "unclaimed",
      claimedAt: restaurantId ? new Date() : null,
    },
    include: { restaurant: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(updated);
}
