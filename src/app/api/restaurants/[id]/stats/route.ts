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

    // 2. Seated tonight + avg wait (exclude walk-ins: phoneE164 = "+00000000000")
    const seatedToday = await prisma.waitlistEntry.findMany({
      where: {
        restaurantId: id,
        status: 'SEATED',
        seatedAt: { gte: todayStart },
        createdAt: { gte: todayStart },
        phoneE164: { not: '+00000000000' },
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

    // Cap: if calculated avg > 30 min, revert to manual setting and log the event
    const AVG_CAP_MIN = 30
    if (avgWaitMinutes !== null && avgWaitMinutes > AVG_CAP_MIN) {
      const settings = await prisma.restaurantSettings.findUnique({
        where: { restaurantId: id },
        select: { waitMinutesPerGroup: true },
      })
      const manualValue = settings?.waitMinutesPerGroup ?? 10
      await prisma.errorLog.create({
        data: {
          restaurantId: id,
          subject: 'Avg wait time reverted',
          description: `Calculated avg ${avgWaitMinutes}m exceeded ${AVG_CAP_MIN}min cap. Reverted to manual value: ${manualValue}m.`,
          status: 'auto',
        },
      }).catch(() => {})
      console.warn(`[stats] avg ${avgWaitMinutes}m > ${AVG_CAP_MIN}min cap, reverted to ${manualValue}m for restaurant ${id}`)
      avgWaitMinutes = manualValue
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
