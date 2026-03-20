import { NextRequest, NextResponse } from 'next/server'
import { issueTicket } from '@/lib/ticket-queue'
import { emitUpdate } from '@/lib/emitter'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ queueId: string }> },
) {
  const { queueId } = await context.params

  const queue = await prisma.ticketQueue.findUnique({ where: { id: queueId } })
  if (!queue) return NextResponse.json({ error: 'queue not found' }, { status: 404 })
  if (queue.status !== 'OPEN') {
    return NextResponse.json(
      { error: `queue is ${queue.status.toLowerCase()}` },
      { status: 422 },
    )
  }

  const body = await req.json().catch(() => ({})) as Record<string, string>
  const ticket = await issueTicket(queueId, {
    phoneE164: body.phoneE164,
    guestName: body.guestName,
  })

  emitUpdate(queueId)
  return NextResponse.json(ticket, { status: 201 })
}
