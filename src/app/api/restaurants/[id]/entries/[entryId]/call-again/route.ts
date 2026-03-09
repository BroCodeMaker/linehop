import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/notify'
import { emitUpdate } from '@/lib/emitter'
import { scheduleReminder } from '@/lib/timers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://waitlist-app-plum.vercel.app'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await context.params

    const entry = await prisma.waitlistEntry.findFirst({
      where: { id: entryId, restaurantId: id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (!['NO_SHOW_CONFIRM', 'NO_SHOW_ARRIVAL'].includes(entry.status)) {
      return NextResponse.json({ error: `Cannot call again from ${entry.status}` }, { status: 400 })
    }

    // Max 1 retry
    if (entry.callAgainCount >= 1) {
      return NextResponse.json({ error: 'Max retries reached' }, { status: 400 })
    }

    // Check still in 10-min buffer
    if (!entry.expiredAt || Date.now() - entry.expiredAt.getTime() > 10 * 60 * 1000) {
      return NextResponse.json({ error: 'Buffer window expired' }, { status: 400 })
    }

    const now = new Date()
    const updated = await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: {
        status: 'CALLED',
        calledAt: now,
        confirmDeadlineAt: new Date(now.getTime() + 120 * 1000),
        callAgainCount: { increment: 1 },
        expiredAt: null,
        expiredReason: null,
      },
    })

    // Send WhatsApp (Feature 10) + schedule 60s reminder
    if (entry.phoneE164 && entry.phoneE164 !== '+00000000000') {
      const statusUrl = `${APP_URL}/s/${entry.publicToken}`
      await sendWhatsAppMessage(
        entryId,
        entry.phoneE164,
        `Vă mai acordăm o șansă! Vă rugăm să vă prezentați la intrare în 2 minute.\n\n✅ Confirmați: ${statusUrl}`
      ).catch(() => {})

      // 60s reminder
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
