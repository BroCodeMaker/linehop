import { NextRequest, NextResponse } from 'next/server'
import { closeQueue } from '@/lib/ticket-queue'
import { emitUpdate } from '@/lib/emitter'
import prisma from '@/lib/prisma'

const VALID_STATUSES = ['OPEN', 'PAUSED', 'CLOSED'] as const
type QueueStatus = (typeof VALID_STATUSES)[number]

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ queueId: string }> },
) {
  const { queueId } = await context.params
  const body = await req.json() as { status?: string }
  const status = body.status as QueueStatus | undefined

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    )
  }

  if (status === 'CLOSED') {
    const result = await closeQueue(queueId)
    return NextResponse.json({ status: 'CLOSED', ...result })
  }

  const queue = await prisma.ticketQueue.update({
    where: { id: queueId },
    data: { status },
  })
  emitUpdate(queueId)
  return NextResponse.json(queue)
}
