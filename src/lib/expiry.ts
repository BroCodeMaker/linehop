import prisma from './prisma'
import { callNext } from './queue'

export async function expireEntries(): Promise<number> {
  const now = new Date()

  // Find which restaurants have CALLED entries about to expire (to auto-call next after)
  const calledExpiring = await prisma.waitlistEntry.findMany({
    where: { status: 'CALLED', confirmDeadlineAt: { lt: now } },
    select: { restaurantId: true },
  })

  // Find which restaurants have CONFIRMED entries about to expire
  const confirmedExpiring = await prisma.waitlistEntry.findMany({
    where: { status: 'CONFIRMED', arrivalDeadlineAt: { lt: now } },
    select: { restaurantId: true },
  })

  // Expire CALLED entries past confirm deadline
  const calledResult = await prisma.waitlistEntry.updateMany({
    where: { status: 'CALLED', confirmDeadlineAt: { lt: now } },
    data: { status: 'EXPIRED', expiredAt: now },
  })

  // Expire CONFIRMED entries past arrival deadline
  const confirmedResult = await prisma.waitlistEntry.updateMany({
    where: { status: 'CONFIRMED', arrivalDeadlineAt: { lt: now } },
    data: { status: 'EXPIRED', expiredAt: now },
  })

  const totalExpired = calledResult.count + confirmedResult.count

  // Auto-call next for each affected restaurant (if there's still someone WAITING)
  if (totalExpired > 0) {
    const affectedIds = new Set([
      ...calledExpiring.map(e => e.restaurantId),
      ...confirmedExpiring.map(e => e.restaurantId),
    ])
    for (const restaurantId of affectedIds) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { status: true },
      })
      // Only auto-call if restaurant is in FULL mode (waitlist active)
      if (restaurant?.status === 'FULL') {
        await callNext(restaurantId)
      }
    }
  }

  return totalExpired
}
