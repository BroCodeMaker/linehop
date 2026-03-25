import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { clearReminderTimer } from '@/lib/timers'
import { emitUpdate } from '@/lib/emitter'
import { verifySession } from '@/lib/session'

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  return !!verifySession(token)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id: restaurantId, entryId } = await context.params
    const body = await request.json()
    const { previousStatus, previousData } = body as {
      previousStatus: string
      previousData: {
        calledAt: string | null
        confirmedAt: string | null
        seatedAt: string | null
        skippedAt: string | null
        expiredAt: string | null
        expiredReason: string | null
        confirmDeadlineAt: string | null
        arrivalDeadlineAt: string | null
        callAgainCount: number
      }
    }

    const VALID_STATUSES = ['WAITING', 'CALLED', 'CONFIRMED', 'SEATED', 'SKIPPED', 'CANCELLED', 'NO_SHOW_CONFIRM', 'NO_SHOW_ARRIVAL', 'EXPIRED'] as const
    type ValidStatus = typeof VALID_STATUSES[number]

    if (!previousStatus || !previousData) {
      return NextResponse.json({ error: 'Missing previousStatus or previousData' }, { status: 400 })
    }

    if (!(VALID_STATUSES as readonly string[]).includes(previousStatus)) {
      return NextResponse.json({ error: 'Invalid previousStatus' }, { status: 400 })
    }

    // Clear any reminder timer on undo (e.g. undoing a call back to WAITING)
    clearReminderTimer(entryId)

    const toDate = (v: string | null) => (v ? new Date(v) : null)

    const result = await prisma.waitlistEntry.updateMany({
      where: { id: entryId, restaurantId },
      data: {
        status: previousStatus,
        calledAt: toDate(previousData.calledAt),
        confirmedAt: toDate(previousData.confirmedAt),
        seatedAt: toDate(previousData.seatedAt),
        skippedAt: toDate(previousData.skippedAt),
        expiredAt: toDate(previousData.expiredAt),
        expiredReason: previousData.expiredReason,
        confirmDeadlineAt: toDate(previousData.confirmDeadlineAt),
        arrivalDeadlineAt: toDate(previousData.arrivalDeadlineAt),
        callAgainCount: previousData.callAgainCount ?? 0,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    emitUpdate(restaurantId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[undo]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
