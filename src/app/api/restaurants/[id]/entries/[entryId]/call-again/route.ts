import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/notify'
import { getRestaurantSettings } from '@/lib/queue'
import { emitUpdate } from '@/lib/emitter'
import { scheduleReminder } from '@/lib/timers'
import { verifySession } from "@/lib/session";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://linehop.app'

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, entryId } = await context.params

    const [entry, settings] = await Promise.all([
      prisma.waitlistEntry.findFirst({ where: { id: entryId, restaurantId: id } }),
      getRestaurantSettings(id),
    ])

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (!['NO_SHOW_CONFIRM', 'NO_SHOW_ARRIVAL'].includes(entry.status)) {
      return NextResponse.json({ error: `Cannot call again from ${entry.status}` }, { status: 400 })
    }

    // Use maxCallAgain from restaurant settings (not hardcoded 1)
    if (entry.callAgainCount >= settings.maxCallAgain) {
      return NextResponse.json({ error: 'Max retries reached' }, { status: 400 })
    }

    // Must still be within the buffer visibility window
    if (!entry.expiredAt || Date.now() - entry.expiredAt.getTime() > settings.bufferVisibilitySec * 1000) {
      return NextResponse.json({ error: 'Buffer window expired' }, { status: 400 })
    }

    const now = new Date()
    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: 'CALLED',
        calledAt: now,
        confirmDeadlineAt: new Date(now.getTime() + settings.confirmTimerSec * 1000),
        callAgainCount: { increment: 1 },
        expiredAt: null,
        expiredReason: null,
      },
    })

    // Send WhatsApp + schedule 60 s reminder
    if (entry.phoneE164 && entry.phoneE164 !== '+00000000000') {
      const statusUrl = `${APP_URL}/s/${entry.publicToken}`
      const name = entry.guestName ?? 'Stimate client'
      const callAgainMsg = settings.msgWhatsappCallAgain.replace('{name}', name)
      await sendWhatsAppMessage(
        entryId,
        entry.phoneE164,
        `${callAgainMsg}\n\n✅ Confirmați: ${statusUrl}`
      ).catch(() => {})

      scheduleReminder(entryId, 60 * 1000, async () => {
        const current = await prisma.waitlistEntry.findUnique({
          where: { id: entryId },
          select: { status: true },
        })
        if (current?.status !== 'CALLED') return
        const cancelUrl = `${APP_URL}/api/public/entry/${entry.publicToken}/cancel-redirect`
        await sendWhatsAppMessage(
          entryId,
          entry.phoneE164,
          `⏰ Reminder: Mai aveți 1 minut să confirmați!\n\n✅ Confirmați: ${statusUrl}\n❌ Anulați: ${cancelUrl}`
        ).catch(() => {})
      })
    }

    emitUpdate(id)

    return NextResponse.json({ ok: true, entry: updated })
  } catch (err) {
    console.error('[call-again]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
