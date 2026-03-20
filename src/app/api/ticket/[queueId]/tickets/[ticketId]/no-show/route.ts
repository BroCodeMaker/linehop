import { NextRequest, NextResponse } from 'next/server'
import { markNoShow } from '@/lib/ticket-queue'

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ queueId: string; ticketId: string }> },
) {
  const { queueId, ticketId } = await context.params
  const result = await markNoShow(queueId, ticketId)
  if (result.count === 0) {
    return NextResponse.json({ error: 'ticket not found or not in CALLED state' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
