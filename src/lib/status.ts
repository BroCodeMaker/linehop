import prisma from './prisma'

export async function getPositionInQueue(restaurantId: string, createdAt: Date): Promise<number> {
  return prisma.waitlistEntry.count({
    where: {
      restaurantId,
      status: 'WAITING',
      createdAt: { lt: createdAt },
    },
  })
}

export function estimateEtaMinutes(position: number): number {
  return position * 20
}
