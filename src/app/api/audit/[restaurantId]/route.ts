import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { restaurantId } = await context.params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "200"), 200);

  const where: { restaurantId: string; createdAt?: { gte: Date; lt: Date } } = { restaurantId };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lt: end };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ ok: true, logs });
}
