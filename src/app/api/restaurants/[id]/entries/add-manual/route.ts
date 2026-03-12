import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { normalizePhone } from '@/lib/phone'
import { emitUpdate } from '@/lib/emitter'
import { verifySession } from "@/lib/session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

const ManualAddSchema = z.object({
  guestName: z.string().min(1),
  partySize: z.number().int().min(1).max(20),
  phoneE164: z.string().min(6).optional().or(z.literal('')),
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
    const parsed = ManualAddSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { guestName, partySize, phoneE164: rawPhone } = parsed.data

    const restaurant = await prisma.restaurant.findUnique({ where: { id } })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const phoneE164 = rawPhone ? normalizePhone(rawPhone) : '+00000000000'

    const entry = await prisma.waitlistEntry.create({
      data: {
        restaurantId: id,
        publicToken: crypto.randomUUID(),
        partySize,
        phoneE164,
        guestName,
        status: 'WAITING',
        createdAt: new Date(),
      },
    })

    emitUpdate(id)

    return NextResponse.json({ ok: true, entry })
  } catch (err) {
    console.error('[add-manual]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
