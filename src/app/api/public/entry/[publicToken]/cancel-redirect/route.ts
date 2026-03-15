import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { clearReminderTimer } from '@/lib/timers'

export async function GET(
  _req: Request,
  context: { params: Promise<{ publicToken: string }> }
) {
  try {
    const { publicToken } = await context.params
    const entry = await prisma.waitlistEntry.findUnique({
      where: { publicToken },
      include: { restaurant: { select: { slug: true } } },
    })

    if (!entry) {
      return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'https://linehop.app'))
    }

    if (['WAITING', 'CALLED', 'CONFIRMED'].includes(entry.status)) {
      clearReminderTimer(entry.id)
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { status: 'CANCELED', canceledAt: new Date() },
      })
    }

    const slug = entry.restaurant.slug
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://linehop.app'}/r/${slug}?canceled=1`
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('[cancel-redirect]', err)
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'https://linehop.app'))
  }
}
