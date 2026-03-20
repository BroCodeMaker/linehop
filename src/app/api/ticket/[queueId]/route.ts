import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ queueId: string }> },
) {
  const { queueId } = await context.params

  const queue = await prisma.ticketQueue.findUnique({
    where: { id: queueId },
    include: { settings: true },
  })
  if (!queue) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const waitingCount = await prisma.ticket.count({
    where: { queueId, status: 'WAITING' },
  })
  const calledTicket = await prisma.ticket.findFirst({
    where: { queueId, status: 'CALLED' },
    orderBy: { calledAt: 'desc' },
  })

  return NextResponse.json({ ...queue, stats: { waitingCount, calledTicket } })
}
