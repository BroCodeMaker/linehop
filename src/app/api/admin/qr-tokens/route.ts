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

  const tokens = await prisma.qrToken.findMany({
    orderBy: { createdAt: "desc" },
    include: { restaurant: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(tokens);
}
