import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { emitUpdate } from '@/lib/emitter'
import { verifySession } from "@/lib/session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

const WalkInSchema = z.object({
  partySize: z.number().int().min(1).max(20),
  notes: z.string().max(500).optional(),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = WalkInSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { partySize, notes } = parsed.data
    const now = new Date()

    const entry = await prisma.waitlistEntry.create({
      data: {
        restaurantId: id,
        publicToken: crypto.randomUUID(),
        partySize,
        phoneE164: '+00000000000',
        guestName: 'Walk-in',
        status: 'SEATED',
        seatedAt: now,
        createdAt: now,
        notes: notes || null,
      },
    })

    emitUpdate(id)

    return NextResponse.json({ ok: true, entry })
  } catch (err) {
    console.error('[walk-in]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
