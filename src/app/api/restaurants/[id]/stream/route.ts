import { NextResponse } from 'next/server'
import { getEmitter } from '@/lib/emitter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const encoder = new TextEncoder()
  let cleanup: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const emitter = getEmitter(id)

      const send = (event: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`))
        } catch {
          // client disconnected
        }
      }

      // Send initial connection confirmation
      send('connected', JSON.stringify({ ok: true }))

      const onUpdate = () => {
        send('update', JSON.stringify({ t: Date.now() }))
      }
      emitter.on('update', onUpdate)

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        send('ping', JSON.stringify({ t: Date.now() }))
      }, 30000)

      cleanup = () => {
        emitter.off('update', onUpdate)
        clearInterval(heartbeat)
      }
    },
    cancel() {
      cleanup?.()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
