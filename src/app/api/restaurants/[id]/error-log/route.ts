import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import prisma from '@/lib/prisma'
import { verifySession } from '@/lib/session'

const execAsync = promisify(exec)

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  return !!verifySession(token)
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await context.params
    const logs = await prisma.errorLog.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: 'desc' },
      include: { restaurant: { select: { name: true } } },
    })
    return NextResponse.json({ ok: true, logs })
  } catch (err) {
    console.error('[error-log GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await context.params
    const { subject, description } = await req.json()
    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 })
    }

    const log = await prisma.errorLog.create({
      data: { restaurantId: id, subject, description },
    })

    // Count open logs and notify via openclaw (best-effort)
    const openCount = await prisma.errorLog.count({
      where: { restaurantId: id, status: 'open' },
    })
    if (openCount > 0) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        select: { name: true },
      })
      await execAsync(
        `openclaw system event --text "LineHop: ${openCount} erori noi in error log pentru ${restaurant?.name ?? id}" --mode now`
      ).catch(() => {})
    }

    return NextResponse.json({ ok: true, log })
  } catch (err) {
    console.error('[error-log POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
