import prisma from './prisma'
import { scheduleReminder, clearReminderTimer } from './timers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://waitlist-app-plum.vercel.app'

async function sendCallNotification(entry: {
  id: string
  phoneE164: string
  publicToken: string
}) {
  // Inline import to avoid circular deps with notify→queue
  const { sendWhatsAppMessage } = await import('./notify')
  const statusUrl = `${APP_URL}/s/${entry.publicToken}`
  await sendWhatsAppMessage(
    entry.id,
    entry.phoneE164,
    `Masa dumneavoastră este gata! Vă rugăm să confirmați prezența în 2 minute. 🍽️\n\nVizualizați statusul: ${statusUrl}`
  ).catch(() => {})

  // Schedule 60s reminder
  scheduleReminder(entry.id, 60 * 1000, async () => {
    // Check if still CALLED (not confirmed/canceled in the meantime)
    const current = await prisma.waitlistEntry.findUnique({
      where: { id: entry.id },
      select: { status: true },
    })
    if (current?.status !== 'CALLED') return

    const cancelUrl = `${APP_URL}/api/public/entry/${entry.publicToken}/cancel-redirect`
    await sendWhatsAppMessage(
      entry.id,
      entry.phoneE164,
      `⏰ Reminder: Mai aveți 1 minut să confirmați!\n\n✅ Confirmați: ${statusUrl}\n❌ Anulați: ${cancelUrl}`
    ).catch(() => {})
  })
}

export async function getQueue(restaurantId: string) {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
  return prisma.waitlistEntry.findMany({
    where: {
      restaurantId,
      OR: [
        { status: { in: ['WAITING', 'CALLED', 'CONFIRMED'] } },
        // Keep NO_SHOW_CONFIRM/NO_SHOW_ARRIVAL visible for 10 min buffer
        { status: 'NO_SHOW_CONFIRM', expiredAt: { gte: tenMinAgo } },
        { status: 'NO_SHOW_ARRIVAL', expiredAt: { gte: tenMinAgo } },
        // Recent SEATED/SKIPPED for undo (last 30 min)
        { status: 'SEATED', seatedAt: { gte: thirtyMinAgo } },
        { status: 'SKIPPED', skippedAt: { gte: thirtyMinAgo } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function callNext(restaurantId: string) {
  const oldest = await prisma.waitlistEntry.findFirst({
    where: { restaurantId, status: 'WAITING' },
    orderBy: { createdAt: 'asc' },
  })
  if (!oldest) return null

  const now = new Date()
  const entry = await prisma.waitlistEntry.update({
    where: { id: oldest.id },
    data: {
      status: 'CALLED',
      calledAt: now,
      confirmDeadlineAt: new Date(now.getTime() + 120 * 1000),
    },
  })

  await sendCallNotification(entry)
  return entry
}

export async function callEntry(restaurantId: string, entryId: string) {
  const existing = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, restaurantId, status: 'WAITING' },
  })
  if (!existing) return null

  const now = new Date()
  const entry = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: {
      status: 'CALLED',
      calledAt: now,
      confirmDeadlineAt: new Date(now.getTime() + 120 * 1000),
    },
  })

  await sendCallNotification(entry)
  return entry
}

export async function seatEntry(restaurantId: string, entryId: string) {
  clearReminderTimer(entryId)
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, restaurantId },
    data: { status: 'SEATED', seatedAt: new Date() },
  })
}

export async function skipEntry(restaurantId: string, entryId: string) {
  clearReminderTimer(entryId)
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, restaurantId },
    data: { status: 'SKIPPED', skippedAt: new Date() },
  })
}

export async function cancelEntry(restaurantId: string, entryId: string) {
  clearReminderTimer(entryId)
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, restaurantId },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })
}

export async function closeRestaurant(restaurantId: string) {
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { status: 'CLOSED' },
  })
  return prisma.waitlistEntry.updateMany({
    where: { restaurantId, status: { in: ['WAITING', 'CALLED', 'CONFIRMED'] } },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })
}

export async function confirmEntry(entryId: string) {
  clearReminderTimer(entryId)
  const now = new Date()
  return prisma.waitlistEntry.update({
    where: { id: entryId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: now,
      arrivalDeadlineAt: new Date(now.getTime() + 300 * 1000),
    },
  })
}
