import prisma from './prisma'
import { callNext } from './queue'
import { sendWhatsAppMessage } from './notify'

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

  // Expire CALLED entries
  const calledResult = await prisma.waitlistEntry.updateMany({
    where: { status: 'CALLED', confirmDeadlineAt: { lt: now } },
    data: { status: 'EXPIRED', expiredAt: now },
  })

  // Expire CONFIRMED entries
  const confirmedResult = await prisma.waitlistEntry.updateMany({
    where: { status: 'CONFIRMED', arrivalDeadlineAt: { lt: now } },
    data: { status: 'EXPIRED', expiredAt: now },
  })

  const totalExpired = calledResult.count + confirmedResult.count

  if (totalExpired === 0) return 0

  // Send WhatsApp notification to each expired client
  for (const entry of calledExpiring) {
    const name = entry.guestName ? `, ${entry.guestName}` : ''
    await sendWhatsAppMessage(
      entry.id,
      entry.phoneE164,
      `⌛ Ne pare rău${name}, timpul de confirmare a expirat. Locul tău în coadă a fost anulat.\n\nDacă dorești, poți reveni mâine. Îți mulțumim!`
    ).catch(() => { /* don't block on notify failure */ })
  }

  for (const entry of confirmedExpiring) {
    const name = entry.guestName ? `, ${entry.guestName}` : ''
    await sendWhatsAppMessage(
      entry.id,
      entry.phoneE164,
      `⌛ Ne pare rău${name}, cele 5 minute de sosire au expirat. Locul tău a fost anulat.\n\nContactează personalul restaurantului dacă ai ajuns. Îți mulțumim!`
    ).catch(() => { /* don't block on notify failure */ })
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
  }

  return totalExpired
}
