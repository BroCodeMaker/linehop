import prisma from './prisma'
import { getNotificationAdapter } from './notification-adapter'

export async function sendTicketWhatsApp(
  ticketId: string,
  to: string,
  body: string,
) {
  const adapter = getNotificationAdapter()
  const result = await adapter.sendMessage(to, body)

  try {
    await prisma.ticketMessageEvent.create({
      data: {
        ticketId,
        direction: 'outbound',
        provider: result.provider,
        phoneE164: to,
        body,
        status: result.ok ? 'sent' : 'failed',
        externalId: result.externalId,
      },
    })
  } catch (err) {
    console.error('[ticket-notify] Failed to log message event:', err)
  }

  return result
}
