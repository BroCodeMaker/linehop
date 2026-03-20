'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface QueueInfo {
  id: string
  name: string
  status: string
  stats: { waitingCount: number }
}

function IssueTicketForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queueSlug = searchParams.get('queue')

  const [queue, setQueue] = useState<QueueInfo | null>(null)
  const [queueId, setQueueId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!queueSlug) {
      setLoading(false)
      setError('No queue specified. Add ?queue=SLUG to the URL.')
      return
    }

    // Look up queue by slug via a simple approach: fetch /api/ticket/[id]
    // Since we only have slug, we need to look it up. Use a search endpoint.
    // For now, we'll use the queueId directly if it's a UUID, else treat as slug.
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUuid = uuidPattern.test(queueSlug)

    const url = isUuid
      ? `/api/ticket/${queueSlug}`
      : `/api/ticket/by-slug/${queueSlug}`

    fetch(url)
      .then((r) => r.json())
      .then((data: QueueInfo) => {
        setQueue(data)
        setQueueId(data.id)
        setLoading(false)
      })
      .catch(() => {
        setError('Queue not found')
        setLoading(false)
      })
  }, [queueSlug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!queueId) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/ticket/${queueId}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: name.trim() || undefined,
          phoneE164: phone.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Could not issue ticket')
        return
      }

      const ticket = await res.json() as { publicToken: string }
      router.push(`/t/${ticket.publicToken}`)
    } catch {
      setError('Network error, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>Loading queue...</div>
    )
  }

  const isOpen = queue?.status === 'OPEN'

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 20px', width: '100%' }}>
      {/* Queue info */}
      {queue && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 16,
          padding: 24,
          marginBottom: 28,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Queue</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f5f5f5', marginBottom: 12 }}>{queue.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <span style={{
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: isOpen ? '#14532d' : '#450a0a',
              color: isOpen ? '#86efac' : '#fca5a5',
            }}>
              {queue.status}
            </span>
            {isOpen && (
              <span style={{ color: '#6b7280', fontSize: 13 }}>
                {queue.stats.waitingCount} waiting
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !queue && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
          color: '#fca5a5',
          fontSize: 16,
        }}>
          {error}
        </div>
      )}

      {/* Form */}
      {queue && (
        <>
          {!isOpen && (
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #450a0a',
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
              textAlign: 'center',
              color: '#fca5a5',
            }}>
              This queue is currently {queue.status.toLowerCase()}. New tickets cannot be issued.
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={!isOpen}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#f5f5f5',
                  fontSize: 16,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>
                Phone for WhatsApp (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+40712345678"
                disabled={!isOpen}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#f5f5f5',
                  fontSize: 16,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#fca5a5', fontSize: 14 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={!isOpen || submitting}
              style={{
                width: '100%',
                padding: '16px',
                background: isOpen ? '#F97316' : '#2a2a2a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 18,
                fontWeight: 700,
                cursor: isOpen ? 'pointer' : 'not-allowed',
                opacity: submitting ? 0.7 : 1,
                marginTop: 8,
              }}
            >
              {submitting ? 'Getting your number...' : 'Get Your Number →'}
            </button>
          </form>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 32, color: '#3f3f3f', fontSize: 12 }}>
        Powered by LineHop
      </div>
    </div>
  )
}

export default function NewTicketPage() {
  return (
    <div style={{
      background: '#0f0f0f',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#f5f5f5',
    }}>
      {/* Header */}
      <div style={{ background: '#F97316', padding: '14px 20px', textAlign: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>LineHop Ticket</span>
      </div>

      <div style={{ padding: '8px 0' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>}>
          <IssueTicketForm />
        </Suspense>
      </div>
    </div>
  )
}
