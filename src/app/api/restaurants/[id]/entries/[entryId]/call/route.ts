import { NextResponse } from 'next/server'
import { callEntry } from '@/lib/queue'
import { emitUpdate } from '@/lib/emitter'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await context.params
    const entry = await callEntry(id, entryId)

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found or not WAITING' }, { status: 404 })
    }

    emitUpdate(id)

    return NextResponse.json({ ok: true, entry })
  } catch (err) {
    console.error('[call-entry]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
