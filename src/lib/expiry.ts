import prisma from './prisma'

export async function expireEntries(): Promise<number> {
  const now = new Date()
  
  // Expire CALLED entries past confirm deadline
  const calledResult = await prisma.waitlistEntry.updateMany({
    where: {
      status: 'CALLED',
      confirmDeadlineAt: { lt: now },
    },
    data: {
      status: 'EXPIRED',
      expiredAt: now,
    },
  })

  // Expire CONFIRMED entries past arrival deadline
  const confirmedResult = await prisma.waitlistEntry.updateMany({
    where: {
      status: 'CONFIRMED',
      arrivalDeadlineAt: { lt: now },
    },
    data: {
      status: 'EXPIRED',
      expiredAt: now,
    },
  })

  return calledResult.count + confirmedResult.count
}
