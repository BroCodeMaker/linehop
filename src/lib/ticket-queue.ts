import prisma from './prisma'
import { scheduleReminder, clearReminderTimer } from './timers'
import { emitUpdate } from './emitter'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://linehop.app'

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getQueueSettings(queueId: string) {
  const s = await prisma.ticketQueueSettings.findUnique({ where: { queueId } })
  return {
    noShowTimerSec: s?.noShowTimerSec ?? 180,
    dailyReset: s?.dailyReset ?? true,
    msgWhatsappCall:
      s?.msgWhatsappCall ??
      'Este rândul dvs.! Numărul {number}. Vă rugăm să vă prezentați.',
    msgWhatsappNoShow:
      s?.msgWhatsappNoShow ?? 'Numărul dvs. {number} a expirat. Ne pare rău.',
    msgWhatsappClosed:
      s?.msgWhatsappClosed ??
      'Coada s-a închis. Numărul dvs. {number} a fost anulat.',
  }
}

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getTicketQueue(queueId: string) {
  return prisma.ticketQueue.findUnique({
    where: { id: queueId },
    include: { settings: true },
  })
}

export async function getTicketQueueBySlug(slug: string) {
  return prisma.ticketQueue.findUnique({
    where: { slug },
    include: { settings: true },
  })
}

export async function getTickets(queueId: string) {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
  return prisma.ticket.findMany({
    where: {
      queueId,
      OR: [
        { status: 'WAITING' },
        { status: 'CALLED' },
        { status: 'DONE', doneAt: { gte: thirtyMinAgo } },
        { status: 'NO_SHOW', noShowAt: { gte: thirtyMinAgo } },
      ],
    },
    orderBy: { number: 'asc' },
  })
}

// ─── Issue ─────────────────────────────────────────────────────────────────────

export async function issueTicket(
  queueId: string,
  data: { phoneE164?: string; guestName?: string },
) {
  const settings = await getQueueSettings(queueId)

  return prisma.$transaction(async (tx) => {
    const whereForNumber: {
      queueId: string
      issuedAt?: { gte: Date }
    } = { queueId }

    if (settings.dailyReset) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      whereForNumber.issuedAt = { gte: startOfDay }
    }

    const agg = await tx.ticket.aggregate({
      where: whereForNumber,
      _max: { number: true },
    })
    const nextNumber = (agg._max.number ?? 0) + 1

    const ticket = await tx.ticket.create({
      data: {
        queueId,
        number: nextNumber,
        phoneE164: data.phoneE164 ?? null,
        guestName: data.guestName ?? null,
        status: 'WAITING',
      },
    })

    return ticket
  })
}

// ─── Call ──────────────────────────────────────────────────────────────────────

export async function callNext(queueId: string) {
  const oldest = await prisma.ticket.findFirst({
    where: { queueId, status: 'WAITING' },
    orderBy: { number: 'asc' },
  })
  if (!oldest) return null
  return callTicket(queueId, oldest.id)
}

export async function callTicket(queueId: string, ticketId: string) {
  const settings = await getQueueSettings(queueId)

  const existing = await prisma.ticket.findFirst({
    where: { id: ticketId, queueId, status: 'WAITING' },
  })
  if (!existing) return null

  const now = new Date()
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'CALLED',
      calledAt: now,
      noShowDeadlineAt: new Date(now.getTime() + settings.noShowTimerSec * 1000),
    },
  })

  // Send WhatsApp if phone provided
  if (ticket.phoneE164) {
    const { sendTicketWhatsApp } = await import('./ticket-notify')
    const msg = settings.msgWhatsappCall.replace('{number}', String(ticket.number))
    const statusUrl = `${APP_URL}/t/${ticket.publicToken}`
    await sendTicketWhatsApp(
      ticket.id,
      ticket.phoneE164,
      `${msg}\n\n${statusUrl}`,
    ).catch(() => {})
  }

  // Schedule no-show timer
  scheduleReminder(ticket.id, settings.noShowTimerSec * 1000, async () => {
    const current = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      select: { status: true },
    })
    if (current?.status !== 'CALLED') return
    await markNoShow(queueId, ticket.id)
  })

  emitUpdate(queueId)
  return ticket
}

// ─── Done ──────────────────────────────────────────────────────────────────────

export async function markDone(queueId: string, ticketId: string) {
  clearReminderTimer(ticketId)
  const result = await prisma.ticket.updateMany({
    where: { id: ticketId, queueId, status: 'CALLED' },
    data: { status: 'DONE', doneAt: new Date() },
  })
  if (result.count > 0) emitUpdate(queueId)
  return result
}

// ─── No-Show ───────────────────────────────────────────────────────────────────

export async function markNoShow(queueId: string, ticketId: string) {
  clearReminderTimer(ticketId)

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, queueId, status: 'CALLED' },
  })
  if (!ticket) return { count: 0 }

  const result = await prisma.ticket.updateMany({
    where: { id: ticketId, queueId, status: 'CALLED' },
    data: { status: 'NO_SHOW', noShowAt: new Date() },
  })

  if (result.count > 0 && ticket.phoneE164) {
    const { sendTicketWhatsApp } = await import('./ticket-notify')
    const settings = await getQueueSettings(queueId)
    const msg = settings.msgWhatsappNoShow.replace('{number}', String(ticket.number))
    await sendTicketWhatsApp(ticket.id, ticket.phoneE164, msg).catch(() => {})
  }

  if (result.count > 0) emitUpdate(queueId)
  return result
}

// ─── Cancel ────────────────────────────────────────────────────────────────────

export async function cancelTicket(queueId: string, ticketId: string) {
  clearReminderTimer(ticketId)
  const result = await prisma.ticket.updateMany({
    where: { id: ticketId, queueId, status: { in: ['WAITING', 'CALLED'] } },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })
  if (result.count > 0) emitUpdate(queueId)
  return result
}

// ─── Close queue ───────────────────────────────────────────────────────────────

export async function closeQueue(queueId: string) {
  const { sendTicketWhatsApp } = await import('./ticket-notify')
  const settings = await getQueueSettings(queueId)

  const activeTickets = await prisma.ticket.findMany({
    where: { queueId, status: { in: ['WAITING', 'CALLED'] } },
  })

  await prisma.ticketQueue.update({
    where: { id: queueId },
    data: { status: 'CLOSED' },
  })

  const canceledAt = new Date()
  await prisma.ticket.updateMany({
    where: { queueId, status: { in: ['WAITING', 'CALLED'] } },
    data: { status: 'CANCELED', canceledAt },
  })

  await Promise.allSettled(
    activeTickets.map(async (t) => {
      clearReminderTimer(t.id)
      if (t.phoneE164) {
        const msg = settings.msgWhatsappClosed.replace('{number}', String(t.number))
        await sendTicketWhatsApp(t.id, t.phoneE164, msg).catch(() => {})
      }
    }),
  )

  emitUpdate(queueId)
  return { canceledCount: activeTickets.length }
}
