import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date') // YYYY-MM-DD
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = 50

    let dateFilter: { gte: Date; lt: Date } | undefined
    if (dateParam) {
      const start = new Date(dateParam)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dateParam)
      end.setHours(23, 59, 59, 999)
      dateFilter = { gte: start, lt: end }
    }

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where: {
          restaurantId: id,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          guestName: true,
          partySize: true,
          status: true,
          createdAt: true,
          seatedAt: true,
          canceledAt: true,
          expiredAt: true,
          phoneE164: true,
        },
      }),
      prisma.waitlistEntry.count({
        where: {
          restaurantId: id,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
    ])

    const enriched = entries.map((e) => {
      const isWalkIn = e.phoneE164 === '+00000000000'
      let waitMinutes: number | null = null
      let cancelAfterMinutes: number | null = null

      if (e.status === 'SEATED' && e.seatedAt && !isWalkIn) {
        waitMinutes = Math.round((e.seatedAt.getTime() - e.createdAt.getTime()) / 60000)
      }

      const endTime = e.canceledAt ?? e.expiredAt
      if (['CANCELLED', 'EXPIRED'].includes(e.status) && endTime) {
        cancelAfterMinutes = Math.round((endTime.getTime() - e.createdAt.getTime()) / 60000)
      }

      return {
        id: e.id,
        guestName: isWalkIn ? 'Walk-in' : e.guestName,
        partySize: e.partySize,
        status: e.status,
        isWalkIn,
        createdAt: e.createdAt,
        seatedAt: e.seatedAt,
        waitMinutes,
        cancelAfterMinutes,
      }
    })

    return NextResponse.json({
      ok: true,
      entries: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('[history]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
