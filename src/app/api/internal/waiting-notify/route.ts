import { NextResponse } from 'next/server'
import { sendWaitingNotifications } from '@/lib/waiting-notifications'

export async function GET() {
  try {
    const sent = await sendWaitingNotifications()
    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('[waiting-notify]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
