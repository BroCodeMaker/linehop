'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

type TicketStatus = 'WAITING' | 'CALLED' | 'DONE' | 'NO_SHOW' | 'CANCELED'

interface TicketData {
  id: string
  number: number
  publicToken: string
  guestName: string | null
  status: TicketStatus
  issuedAt: string
  calledAt: string | null
  doneAt: string | null
  noShowAt: string | null
  canceledAt: string | null
  noShowDeadlineAt: string | null
  position: number | null
  queue: {
    id: string
    name: string
    status: string
    slug: string
  }
}

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; emoji: string }> = {
  WAITING:  { label: 'Waiting',   color: '#93c5fd', bg: '#1e3a5f', emoji: '⏳' },
  CALLED:   { label: 'Called!',   color: '#fed7aa', bg: '#7c2d12', emoji: '📣' },
  DONE:     { label: 'Served',    color: '#86efac', bg: '#14532d', emoji: '✅' },
  NO_SHOW:  { label: 'Expired',   color: '#fca5a5', bg: '#450a0a', emoji: '⌛' },
  CANCELED: { label: 'Canceled',  color: '#d1d5db', bg: '#1f1f1f', emoji: '🚫' },
}

export default function TicketStatusPage() {
  const { publicToken } = useParams<{ publicToken: string }>()
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/ticket/${publicToken}`)
      if (!res.ok) {
        setError('Ticket not found')
        setLoading(false)
        return
      }
      const data = await res.json() as TicketData
      setTicket(data)
      setLoading(false)
    } catch {
      setError('Could not load ticket')
      setLoading(false)
    }
  }, [publicToken])

  useEffect(() => {
    void fetchTicket()
  }, [fetchTicket])

  // SSE — only when we have the queueId
  useEffect(() => {
    if (!ticket?.queue?.id) return
    const es = new EventSource(`/api/ticket/${ticket.queue.id}/stream`)
    es.addEventListener('update', () => void fetchTicket())
    return () => es.close()
  }, [ticket?.queue?.id, fetchTicket])

  async function handleCancel() {
    if (!ticket) return
    setCanceling(true)
    try {
      const res = await fetch(
        `/api/ticket/${ticket.queue.id}/tickets/${ticket.id}/cancel`,
        { method: 'POST' },
      )
      if (res.ok) {
        setCancelDone(true)
        await fetchTicket()
      } else {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Cancel failed')
      }
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: '#0f0f0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: 16 }}>Loading...</div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div style={{ background: '#0f0f0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 40, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ color: '#fca5a5', fontSize: 18, fontWeight: 600 }}>{error ?? 'Ticket not found'}</div>
        </div>
      </div>
    )
  }

  const cfg = statusConfig[ticket.status]
  const isCalled = ticket.status === 'CALLED'
  const isActive = ticket.status === 'WAITING' || ticket.status === 'CALLED'

  return (
    <div style={{
      background: '#0f0f0f',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{ background: '#F97316', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>LineHop Ticket</span>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{ticket.queue.name}</span>
      </div>

      <div style={{ flex: 1, padding: '32px 20px', maxWidth: 440, margin: '0 auto', width: '100%' }}>
        {/* Called alert */}
        {isCalled && (
          <div style={{
            background: '#7c2d12',
            border: '2px solid #F97316',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            textAlign: 'center',
            animation: 'pulse 2s infinite',
          }}>
            <div style={{ fontSize: 28 }}>📣</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fed7aa', marginTop: 8 }}>
              It&apos;s your turn! Please proceed.
            </div>
          </div>
        )}

        {/* Ticket card */}
        <div style={{
          background: '#1a1a1a',
          border: `2px solid ${isActive ? '#F97316' : '#2a2a2a'}`,
          borderRadius: 20,
          padding: 32,
          marginBottom: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Ticket Number
          </div>
          <div style={{ fontSize: 96, fontWeight: 900, color: '#F97316', lineHeight: 1, marginBottom: 16 }}>
            {String(ticket.number).padStart(3, '0')}
          </div>
          {ticket.guestName && (
            <div style={{ fontSize: 18, color: '#d1d5db', marginBottom: 16 }}>{ticket.guestName}</div>
          )}

          {/* Status badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            borderRadius: 20,
            background: cfg.bg,
            color: cfg.color,
            fontWeight: 700,
            fontSize: 16,
          }}>
            {cfg.emoji} {cfg.label}
          </div>
        </div>

        {/* Position / Wait info */}
        {ticket.status === 'WAITING' && ticket.position !== null && (
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Position in queue</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#f5f5f5' }}>#{ticket.position}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Est. wait</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#d1d5db' }}>
                  ~{Math.max(1, (ticket.position - 1) * 5)} min
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No-show deadline */}
        {isCalled && ticket.noShowDeadlineAt && (
          <div style={{ background: '#1a1a1a', border: '1px solid #7c2d12', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#fca5a5' }}>
              Please arrive by{' '}
              <strong>{new Date(ticket.noShowDeadlineAt).toLocaleTimeString()}</strong>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {ticket.status === 'WAITING' && !cancelDone && (
          <button
            onClick={() => void handleCancel()}
            disabled={canceling}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              border: '1px solid #3f3f3f',
              borderRadius: 10,
              color: '#9ca3af',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {canceling ? 'Canceling...' : 'Cancel my ticket'}
          </button>
        )}

        {cancelDone && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Ticket canceled.</div>
        )}

        {error && (
          <div style={{ color: '#fca5a5', fontSize: 13, textAlign: 'center', marginTop: 12 }}>{error}</div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, color: '#3f3f3f', fontSize: 12 }}>
          Powered by LineHop
        </div>
      </div>
    </div>
  )
}
