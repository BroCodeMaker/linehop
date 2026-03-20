import { NextRequest, NextResponse } from 'next/server'
import { getTicketQueueBySlug } from '@/lib/ticket-queue'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params
  const queue = await getTicketQueueBySlug(slug)
  if (!queue) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const waitingCount = await prisma.ticket.count({
    where: { queueId: queue.id, status: 'WAITING' },
  })

  return NextResponse.json({ ...queue, stats: { waitingCount } })
}
