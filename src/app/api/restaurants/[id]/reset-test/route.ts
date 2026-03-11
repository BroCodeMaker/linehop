import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  await prisma.messageEvent.deleteMany({ where: { entry: { restaurantId: id } } })
  await prisma.waitlistEntry.deleteMany({ where: { restaurantId: id } })

  return NextResponse.json({ ok: true, message: 'Queue cleared' })
}
