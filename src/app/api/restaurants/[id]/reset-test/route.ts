import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifySession } from "@/lib/session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params

  await prisma.messageEvent.deleteMany({ where: { entry: { restaurantId: id } } })
  await prisma.waitlistEntry.deleteMany({ where: { restaurantId: id } })

  return NextResponse.json({ ok: true, message: 'Queue cleared' })
}
