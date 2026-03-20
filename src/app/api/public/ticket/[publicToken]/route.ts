import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ publicToken: string }> },
) {
  const { publicToken } = await context.params

  const ticket = await prisma.ticket.findUnique({
    where: { publicToken },
    include: { queue: { select: { id: true, name: true, status: true, slug: true } } },
  })
  if (!ticket) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Position in queue (only counts WAITING tickets before this one)
  let position: number | null = null
  if (ticket.status === 'WAITING') {
    position = await prisma.ticket.count({
      where: {
        queueId: ticket.queueId,
        status: 'WAITING',
        number: { lt: ticket.number },
      },
    })
    position += 1 // 1-based
  }

  return NextResponse.json({ ...ticket, position })
}
