import prisma from './prisma'
import { getRestaurantSettings } from './queue'
import { sendWhatsAppMessage } from './notify'

export async function sendWaitingNotifications(): Promise<number> {
  const now = new Date()
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000)
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000)

  // Find WAITING entries due for notification:
  // • Never notified AND waiting >= 10 min
  // • Already notified AND >= 15 min since last notification
  const entries = await prisma.waitlistEntry.findMany({
    where: {
      status: 'WAITING',
      phoneE164: { not: '+00000000000' }, // skip walk-ins
      OR: [
        { lastWaitingNotifiedAt: null, createdAt: { lte: tenMinAgo } },
        { lastWaitingNotifiedAt: { lte: fifteenMinAgo } },
      ],
    },
    select: {
      id: true,
      restaurantId: true,
      phoneE164: true,
      guestName: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  if (entries.length === 0) return 0

  const settingsCache = new Map<string, Awaited<ReturnType<typeof getRestaurantSettings>>>()
  async function getSettings(restaurantId: string) {
    if (!settingsCache.has(restaurantId)) {
      settingsCache.set(restaurantId, await getRestaurantSettings(restaurantId))
    }
    return settingsCache.get(restaurantId)!
  }

  let sent = 0
  for (const entry of entries) {
    // Count how many WAITING entries are ahead of this one
    const position = await prisma.waitlistEntry.count({
      where: {
        restaurantId: entry.restaurantId,
        status: 'WAITING',
        createdAt: { lt: entry.createdAt },
      },
    })

    const settings = await getSettings(entry.restaurantId)
    const name = entry.guestName ?? 'Stimate client'
    const msg = settings.msgWhatsappWaiting
      .replace('{name}', name)
      .replace('{position}', String(position))

    const result = await sendWhatsAppMessage(entry.id, entry.phoneE164, msg).catch(() => null)
    if (result !== null) {
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { lastWaitingNotifiedAt: now },
      })
      sent++
    }
  }

  return sent
}
