import prisma from './prisma'

export async function getQueue(restaurantId: string) {
  return prisma.waitlistEntry.findMany({
    where: {
      restaurantId,
      status: { in: ['WAITING', 'CALLED', 'CONFIRMED'] },
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
  return prisma.waitlistEntry.update({
    where: { id: oldest.id },
    data: {
      status: 'CALLED',
      calledAt: now,
      confirmDeadlineAt: new Date(now.getTime() + 120 * 1000), // 2 min to confirm
    },
  })
}

export async function seatEntry(restaurantId: string, entryId: string) {
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, restaurantId },
    data: { status: 'SEATED', seatedAt: new Date() },
  })
}

export async function skipEntry(restaurantId: string, entryId: string) {
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, restaurantId },
    data: { status: 'SKIPPED', skippedAt: new Date() },
  })
}

export async function cancelEntry(restaurantId: string, entryId: string) {
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
