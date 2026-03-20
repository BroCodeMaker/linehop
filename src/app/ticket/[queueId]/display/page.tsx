'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface Ticket {
  id: string
  number: number
  guestName: string | null
  status: string
  calledAt: string | null
}

interface QueueData {
  id: string
  name: string
  status: string
  stats: {
    waitingCount: number
    calledTicket: Ticket | null
  }
}

export default function DisplayPage() {
  const { queueId } = useParams<{ queueId: string }>()
  const [queue, setQueue] = useState<QueueData | null>(null)
  const [lastCalled, setLastCalled] = useState<number[]>([])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/ticket/${queueId}`)
      if (!res.ok) return
      const data = await res.json() as QueueData
      setQueue(data)

      if (data.stats.calledTicket) {
        setLastCalled((prev) => {
          const n = data.stats.calledTicket!.number
          if (prev[0] === n) return prev
          return [n, ...prev].slice(0, 5)
        })
      }
    } catch {
      // silent
    }
  }, [queueId])

  useEffect(() => {
    void fetchData()
    const es = new EventSource(`/api/ticket/${queueId}/stream`)
    es.addEventListener('update', () => void fetchData())
    es.addEventListener('connected', () => void fetchData())
    return () => es.close()
  }, [queueId, fetchData])

  const current = queue?.stats?.calledTicket

  return (
    <div style={{
      background: '#0a0a0a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      color: '#f5f5f5',
    }}>
      {/* Top bar */}
      <div style={{
        background: '#F97316',
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 800, fontSize: 24, color: '#fff' }}>
          LineHop Ticket
        </div>
        {queue && (
          <div style={{ fontWeight: 600, fontSize: 20, color: '#fff' }}>
            {queue.name}
          </div>
        )}
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Main display */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        {queue?.status === 'CLOSED' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#6b7280' }}>Queue Closed</div>
          </div>
        ) : queue?.status === 'PAUSED' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏸</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fde68a' }}>Temporarily Paused</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: 700 }}>
            {/* Now Serving */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 24, color: '#6b7280', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 4 }}>
                Now Serving
              </div>
              <div style={{
                fontSize: 180,
                fontWeight: 900,
                color: '#F97316',
                lineHeight: 1,
                textShadow: '0 0 80px rgba(249,115,22,0.4)',
              }}>
                {current ? String(current.number).padStart(3, '0') : '---'}
              </div>
              {current?.guestName && (
                <div style={{ fontSize: 28, color: '#d1d5db', marginTop: 8 }}>{current.guestName}</div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 120, height: 3, background: '#F97316', margin: '0 auto 40px', borderRadius: 2 }} />

            {/* Recent history */}
            {lastCalled.length > 1 && (
              <div>
                <div style={{ fontSize: 16, color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>
                  Recently Called
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {lastCalled.slice(1).map((n) => (
                    <div key={n} style={{
                      padding: '10px 24px',
                      background: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: 8,
                      fontSize: 28,
                      fontWeight: 700,
                      color: '#9ca3af',
                    }}>
                      {String(n).padStart(3, '0')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        background: '#111',
        padding: '14px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #222',
      }}>
        <div style={{ fontSize: 16, color: '#6b7280' }}>
          {queue?.stats?.waitingCount ?? 0} in queue
        </div>
        <div style={{
          fontSize: 14,
          padding: '4px 14px',
          borderRadius: 20,
          background: queue?.status === 'OPEN' ? '#14532d' : '#2a2a2a',
          color: queue?.status === 'OPEN' ? '#86efac' : '#6b7280',
        }}>
          {queue?.status ?? '…'}
        </div>
      </div>
    </div>
  )
}
