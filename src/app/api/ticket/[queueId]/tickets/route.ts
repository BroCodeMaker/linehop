import { NextRequest, NextResponse } from 'next/server'
import { getTickets } from '@/lib/ticket-queue'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ queueId: string }> },
) {
  const { queueId } = await context.params
  const tickets = await getTickets(queueId)
  return NextResponse.json(tickets)
}
