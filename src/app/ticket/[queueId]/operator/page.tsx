'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

type TicketStatus = 'WAITING' | 'CALLED' | 'DONE' | 'NO_SHOW' | 'CANCELED'
type QueueStatus = 'OPEN' | 'PAUSED' | 'CLOSED'

interface Ticket {
  id: string
  number: number
  guestName: string | null
  phoneE164: string | null
  status: TicketStatus
  issuedAt: string
  calledAt: string | null
  noShowDeadlineAt: string | null
}

interface QueueData {
  id: string
  name: string
  status: QueueStatus
  stats: {
    waitingCount: number
    calledTicket: Ticket | null
  }
}

const ORANGE = '#F97316'
const BG = '#0f0f0f'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const TEXT = '#f5f5f5'
const MUTED = '#888'

function waitTime(issuedAt: string) {
  const mins = Math.floor((Date.now() - new Date(issuedAt).getTime()) / 60000)
  if (mins < 1) return '<1 min'
  return `${mins} min`
}

export default function OperatorPage() {
  const { queueId } = useParams<{ queueId: string }>()
  const [queue, setQueue] = useState<QueueData | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, tRes] = await Promise.all([
        fetch(`/api/ticket/${queueId}`),
        fetch(`/api/ticket/${queueId}/tickets`),
      ])
      if (!qRes.ok) throw new Error('queue fetch failed')
      const [qData, tData] = await Promise.all([
        qRes.json() as Promise<QueueData>,
        tRes.ok ? (tRes.json() as Promise<Ticket[]>) : Promise.resolve([]),
      ])
      setQueue(qData)
      setTickets(tData)
      setLoading(false)
    } catch {
      setError('Failed to load queue data')
      setLoading(false)
    }
  }, [queueId])

  useEffect(() => {
    void fetchAll()
    const es = new EventSource(`/api/ticket/${queueId}/stream`)
    es.addEventListener('update', () => void fetchAll())
    es.addEventListener('connected', () => void fetchAll())
    return () => es.close()
  }, [queueId, fetchAll])

  async function doAction(path: string, label: string) {
    setActionLoading(label)
    try {
      const res = await fetch(path, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Action failed')
      } else {
        await fetchAll()
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function updateStatus(status: QueueStatus) {
    setActionLoading('status')
    const confirmed =
      status === 'CLOSED'
        ? window.confirm('Close queue? This will cancel all active tickets and notify guests.')
        : true
    if (!confirmed) {
      setActionLoading(null)
      return
    }
    try {
      await fetch(`/api/ticket/${queueId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await fetchAll()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: MUTED }}>Loading...</p>
      </div>
    )
  }

  const calledTicket = queue?.stats?.calledTicket
  const waitingTickets = tickets.filter((t) => t.status === 'WAITING')

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ color: ORANGE, fontWeight: 700, fontSize: 18 }}>LineHop Ticket</span>
          <span style={{ color: MUTED, marginLeft: 12, fontSize: 14 }}>Operator</span>
        </div>
        {queue && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: MUTED }}>{queue.name}</span>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: queue.status === 'OPEN' ? '#14532d' : queue.status === 'PAUSED' ? '#713f12' : '#450a0a',
              color: queue.status === 'OPEN' ? '#86efac' : queue.status === 'PAUSED' ? '#fde68a' : '#fca5a5',
            }}>
              {queue.status}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#450a0a', color: '#fca5a5', padding: '10px 24px', fontSize: 14 }}>
          {error}{' '}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        {/* Top row: Call Next + Currently Called */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Call Next */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: MUTED, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Queue</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: TEXT }}>
              {queue?.stats?.waitingCount ?? 0}
              <span style={{ fontSize: 18, color: MUTED, marginLeft: 6 }}>waiting</span>
            </div>
            <button
              onClick={() => void doAction(`/api/ticket/${queueId}/call-next`, 'call-next')}
              disabled={actionLoading === 'call-next' || queue?.status !== 'OPEN' || (queue?.stats?.waitingCount ?? 0) === 0}
              style={{
                background: actionLoading === 'call-next' ? '#9a3412' : ORANGE,
                color: '#fff', border: 'none', borderRadius: 8, padding: '14px 20px',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                opacity: (queue?.status !== 'OPEN' || (queue?.stats?.waitingCount ?? 0) === 0) ? 0.4 : 1,
              }}
            >
              {actionLoading === 'call-next' ? 'Calling...' : '▶ Call Next'}
            </button>
          </div>

          {/* Currently Called */}
          <div style={{ background: CARD, border: `2px solid ${calledTicket ? ORANGE : BORDER}`, borderRadius: 12, padding: 24 }}>
            <div style={{ color: MUTED, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Now Called</div>
            {calledTicket ? (
              <>
                <div style={{ fontSize: 52, fontWeight: 900, color: ORANGE, marginBottom: 4 }}>#{calledTicket.number}</div>
                {calledTicket.guestName && <div style={{ color: TEXT, marginBottom: 4, fontSize: 15 }}>{calledTicket.guestName}</div>}
                {calledTicket.noShowDeadlineAt && (
                  <div style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>
                    No-show at {new Date(calledTicket.noShowDeadlineAt).toLocaleTimeString()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => void doAction(`/api/ticket/${queueId}/tickets/${calledTicket.id}/done`, 'done')}
                    disabled={actionLoading === 'done'}
                    style={{ flex: 1, background: '#166534', color: '#86efac', border: 'none', borderRadius: 6, padding: '10px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
                  >
                    ✓ Done
                  </button>
                  <button
                    onClick={() => void doAction(`/api/ticket/${queueId}/tickets/${calledTicket.id}/no-show`, 'no-show')}
                    disabled={actionLoading === 'no-show'}
                    style={{ flex: 1, background: '#450a0a', color: '#fca5a5', border: 'none', borderRadius: 6, padding: '10px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
                  >
                    ✗ No-Show
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: MUTED, fontSize: 15, paddingTop: 16 }}>No ticket currently called</div>
            )}
          </div>
        </div>

        {/* Waiting list */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
            <span>Waiting ({waitingTickets.length})</span>
            <a href={`/ticket/${queueId}/display`} target="_blank" rel="noreferrer"
              style={{ color: ORANGE, fontSize: 13, textDecoration: 'none', fontWeight: 400 }}>
              Display Screen ↗
            </a>
          </div>
          {waitingTickets.length === 0 ? (
            <div style={{ padding: 32, color: MUTED, textAlign: 'center' }}>Queue is empty</div>
          ) : (
            waitingTickets.map((t) => (
              <div key={t.id} style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: TEXT, minWidth: 52 }}>#{t.number}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: TEXT, fontSize: 14 }}>{t.guestName ?? '—'}</div>
                  <div style={{ color: MUTED, fontSize: 12 }}>Waiting {waitTime(t.issuedAt)}</div>
                </div>
                <button
                  onClick={() => void doAction(`/api/ticket/${queueId}/tickets/${t.id}/cancel`, `cancel-${t.id}`)}
                  disabled={actionLoading === `cancel-${t.id}`}
                  style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}
                >
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>

        {/* Queue controls */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Queue Controls</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['OPEN', 'PAUSED', 'CLOSED'] as QueueStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => void updateStatus(s)}
                disabled={actionLoading === 'status' || queue?.status === s}
                style={{
                  padding: '10px 24px', borderRadius: 8, cursor: queue?.status === s ? 'default' : 'pointer',
                  fontWeight: 600, fontSize: 14,
                  background: queue?.status === s
                    ? (s === 'OPEN' ? '#14532d' : s === 'PAUSED' ? '#713f12' : '#450a0a')
                    : '#2a2a2a',
                  color: queue?.status === s
                    ? (s === 'OPEN' ? '#86efac' : s === 'PAUSED' ? '#fde68a' : '#fca5a5')
                    : TEXT,
                  border: `1px solid ${BORDER}`,
                  opacity: actionLoading === 'status' ? 0.6 : 1,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>
            CLOSED will cancel all active tickets and send WhatsApp notifications to guests.
          </p>
        </div>
      </div>
    </div>
  )
}
