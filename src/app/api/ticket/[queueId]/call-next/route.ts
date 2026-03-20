import { NextRequest, NextResponse } from 'next/server'
import { callNext } from '@/lib/ticket-queue'

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ queueId: string }> },
) {
  const { queueId } = await context.params
  const ticket = await callNext(queueId)
  if (!ticket) {
    return NextResponse.json({ error: 'no waiting tickets' }, { status: 404 })
  }
  return NextResponse.json(ticket)
}
