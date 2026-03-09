import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Midnight local time (UTC is fine for server-side calc)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // 1. Waiting now
    const waitingNow = await prisma.waitlistEntry.count({
      where: { restaurantId: id, status: 'WAITING' },
    })

    // 2. Seated tonight + avg wait
    const seatedToday = await prisma.waitlistEntry.findMany({
      where: {
        restaurantId: id,
        status: 'SEATED',
        seatedAt: { gte: todayStart },
        createdAt: { gte: todayStart },
      },
      select: { createdAt: true, seatedAt: true },
    })

    const seatedTonight = seatedToday.length
    let avgWaitMinutes: number | null = null
    if (seatedTonight > 0) {
      const totalMs = seatedToday.reduce((sum, e) => {
        return sum + (e.seatedAt!.getTime() - e.createdAt.getTime())
      }, 0)
      avgWaitMinutes = Math.round(totalMs / seatedTonight / 60000)
    }

    // 3. Confirm rate: entries that were called today vs those that confirmed/seated
    const calledToday = await prisma.waitlistEntry.count({
      where: {
        restaurantId: id,
        calledAt: { gte: todayStart },
      },
    })

    const confirmedOrSeated = await prisma.waitlistEntry.count({
      where: {
        restaurantId: id,
        calledAt: { gte: todayStart },
        status: { in: ['CONFIRMED', 'SEATED'] },
      },
    })

    const confirmRate = calledToday > 0
      ? Math.round((confirmedOrSeated / calledToday) * 100)
      : null

    return NextResponse.json({
      ok: true,
      waitingNow,
      avgWaitMinutes,
      seatedTonight,
      confirmRate,
    })
  } catch (err) {
    console.error('[stats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
