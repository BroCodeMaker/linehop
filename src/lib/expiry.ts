import prisma from './prisma'
import { callNext, getRestaurantSettings } from './queue'
import { sendWhatsAppMessage } from './notify'
import { emitUpdate } from './emitter'

export async function expireEntries(): Promise<number> {
  const now = new Date()

  // Collect entries that will expire — need details to notify + auto-call
  const calledExpiring = await prisma.waitlistEntry.findMany({
    where: { status: 'CALLED', confirmDeadlineAt: { lt: now } },
    select: { id: true, restaurantId: true, phoneE164: true, guestName: true },
  })

  const confirmedExpiring = await prisma.waitlistEntry.findMany({
    where: { status: 'CONFIRMED', arrivalDeadlineAt: { lt: now } },
    select: { id: true, restaurantId: true, phoneE164: true, guestName: true },
  })

  // Expire CALLED → NO_SHOW_CONFIRM
  const calledResult = await prisma.waitlistEntry.updateMany({
    where: { status: 'CALLED', confirmDeadlineAt: { lt: now } },
    data: { status: 'NO_SHOW_CONFIRM', expiredAt: now, expiredReason: 'NO_SHOW_CONFIRM' },
  })

  // Expire CONFIRMED → NO_SHOW_ARRIVAL
  const confirmedResult = await prisma.waitlistEntry.updateMany({
    where: { status: 'CONFIRMED', arrivalDeadlineAt: { lt: now } },
    data: { status: 'NO_SHOW_ARRIVAL', expiredAt: now, expiredReason: 'NO_SHOW_ARRIVAL' },
  })

  const totalExpired = calledResult.count + confirmedResult.count

  if (totalExpired === 0) return 0

  // Send WhatsApp notification to each expired client — use per-restaurant settings with {name}
  const settingsCache = new Map<string, Awaited<ReturnType<typeof getRestaurantSettings>>>()
  async function getSettings(restaurantId: string) {
    if (!settingsCache.has(restaurantId)) {
      settingsCache.set(restaurantId, await getRestaurantSettings(restaurantId))
    }
    return settingsCache.get(restaurantId)!
  }

  for (const entry of calledExpiring) {
    if (!entry.phoneE164 || entry.phoneE164 === '+00000000000') continue
    const settings = await getSettings(entry.restaurantId)
    const name = entry.guestName ?? 'Stimate client'
    const msg = settings.msgWhatsappExpire.replace('{name}', name)
    await sendWhatsAppMessage(entry.id, entry.phoneE164, msg)
      .catch(() => { /* don't block on notify failure */ })
  }

  for (const entry of confirmedExpiring) {
    if (!entry.phoneE164 || entry.phoneE164 === '+00000000000') continue
    const settings = await getSettings(entry.restaurantId)
    const name = entry.guestName ?? 'Stimate client'
    const msg = settings.msgWhatsappExpire.replace('{name}', name)
    await sendWhatsAppMessage(entry.id, entry.phoneE164, msg)
      .catch(() => { /* don't block on notify failure */ })
  }

  // Auto-call next for each affected restaurant (if still FULL)
  const affectedIds = new Set([
    ...calledExpiring.map(e => e.restaurantId),
    ...confirmedExpiring.map(e => e.restaurantId),
  ])

  for (const restaurantId of affectedIds) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { status: true },
    })
    if (restaurant?.status === 'FULL') {
      await callNext(restaurantId)
    }
    emitUpdate(restaurantId)
  }

  return totalExpired
}
