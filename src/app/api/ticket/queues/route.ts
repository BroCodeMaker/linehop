import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, businessType, timezone } = body as Record<string, string>

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
    }

    const queue = await prisma.ticketQueue.create({
      data: {
        name,
        slug,
        businessType: businessType ?? 'generic',
        timezone: timezone ?? 'Europe/Bucharest',
        settings: { create: {} },
      },
      include: { settings: true },
    })

    return NextResponse.json(queue, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
