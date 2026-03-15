import prisma from './prisma'
import { scheduleReminder, clearReminderTimer } from './timers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://linehop.app'

// ─── Settings helper ──────────────────────────────────────────────────────────
// Fetches restaurant settings with safe defaults so every timer uses DB values,
// not hardcoded constants.
export async function getRestaurantSettings(restaurantId: string) {
  const s = await prisma.restaurantSettings.findUnique({ where: { restaurantId } })
  return {
    confirmTimerSec:      s?.confirmTimerSec      ?? 120,
    arrivalTimerSec:      s?.arrivalTimerSec      ?? 300,
    bufferVisibilitySec:  s?.bufferVisibilitySec  ?? 600,
    maxCallAgain:         s?.maxCallAgain          ?? 1,
    waitMinutesPerGroup:  s?.waitMinutesPerGroup   ?? 10,
    msgWhatsappCall:      s?.msgWhatsappCall       ?? 'Vă rugăm să vă prezentați la intrare în 2 minute.',
    msgWhatsappExpire:    s?.msgWhatsappExpire     ?? 'Din păcate locul dumneavoastră a expirat.',
    msgWhatsappCallAgain: s?.msgWhatsappCallAgain  ?? 'Vă mai acordăm o șansă, vă rugăm să vă prezentați.',
    msgWhatsappWaiting:   (s as { msgWhatsappWaiting?: string } | null)?.msgWhatsappWaiting
      ?? '📣 Mulțumim pentru răbdare, {name}! Mai sunt {position} grupuri înaintea dvs. Încă sunteți în lista noastră de așteptare.',
  }
}

// ─── Call notification + 60 s reminder ───────────────────────────────────────
export async function sendCallNotification(entry: {
  id: string
  phoneE164: string
  publicToken: string
  guestName?: string | null
  restaurantId: string
}) {
  // Inline import to avoid circular deps with notify→queue
  const { sendWhatsAppMessage } = await import('./notify')
  const settings = await getRestaurantSettings(entry.restaurantId)
  const name = entry.guestName ?? 'Stimate client'
  const statusUrl = `${APP_URL}/s/${entry.publicToken}`
  const callMsg = settings.msgWhatsappCall.replace('{name}', name)
  await sendWhatsAppMessage(
    entry.id,
    entry.phoneE164,
    `${callMsg}\n\nVizualizați statusul: ${statusUrl}`
  ).catch(() => {})

  // Schedule 60 s reminder (best-effort; lost on serverless cold starts)
  scheduleReminder(entry.id, 60 * 1000, async () => {
    const current = await prisma.waitlistEntry.findUnique({
      where: { id: entry.id },
      select: { status: true },
    })
    if (current?.status !== 'CALLED') return

    const cancelUrl = `${APP_URL}/api/public/entry/${entry.publicToken}/cancel-redirect`
    await sendWhatsAppMessage(
      entry.id,
      entry.phoneE164,
      `⏰ Reminder: Mai aveți 1 minut să confirmați!\n\n✅ Confirmați: ${statusUrl}\n❌ Anulați: ${cancelUrl}`
    ).catch(() => {})
  })
}

// ─── Queue read ───────────────────────────────────────────────────────────────
export async function getQueue(restaurantId: string) {
  const TEN_MIN_AGO = new Date(Date.now() - 10 * 60 * 1000)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)

  return prisma.waitlistEntry.findMany({
    where: {
      restaurantId,
      OR: [
        { status: { in: ['WAITING', 'CALLED', 'CONFIRMED'] } },
        // Keep NO_SHOW visible for 10 minutes (hardcoded, not configurable)
        { status: 'NO_SHOW_CONFIRM', expiredAt: { gte: TEN_MIN_AGO } },
        { status: 'NO_SHOW_ARRIVAL', expiredAt: { gte: TEN_MIN_AGO } },
        // Recent SEATED/SKIPPED for undo (last 30 min)
        { status: 'SEATED',  seatedAt:  { gte: thirtyMinAgo } },
        { status: 'SKIPPED', skippedAt: { gte: thirtyMinAgo } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  })
}

// ─── Call next (auto) ─────────────────────────────────────────────────────────
export async function callNext(restaurantId: string) {
  const oldest = await prisma.waitlistEntry.findFirst({
    where: { restaurantId, status: 'WAITING' },
    orderBy: { createdAt: 'asc' },
  })
  if (!oldest) return null

  const settings = await getRestaurantSettings(restaurantId)
  const now = new Date()
  const entry = await prisma.waitlistEntry.update({
    where: { id: oldest.id },
    data: {
      status: 'CALLED',
      calledAt: now,
      confirmDeadlineAt: new Date(now.getTime() + settings.confirmTimerSec * 1000),
    },
  })

  await sendCallNotification(entry)
  return entry
}

// ─── Call specific entry ──────────────────────────────────────────────────────
export async function callEntry(restaurantId: string, entryId: string) {
  const existing = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, restaurantId, status: 'WAITING' },
  })
  if (!existing) return null

  const settings = await getRestaurantSettings(restaurantId)
  const now = new Date()
  const entry = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: {
      status: 'CALLED',
      calledAt: now,
      confirmDeadlineAt: new Date(now.getTime() + settings.confirmTimerSec * 1000),
    },
  })

  await sendCallNotification(entry)
  return entry
}

// ─── Seat ─────────────────────────────────────────────────────────────────────
export async function seatEntry(restaurantId: string, entryId: string) {
  clearReminderTimer(entryId)
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, restaurantId, status: { in: ['WAITING', 'CALLED', 'CONFIRMED'] } },
    data: { status: 'SEATED', seatedAt: new Date() },
  })
}

// ─── Skip ─────────────────────────────────────────────────────────────────────
export async function skipEntry(restaurantId: string, entryId: string) {
  clearReminderTimer(entryId)
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, restaurantId, status: { in: ['WAITING', 'CALLED', 'CONFIRMED'] } },
    data: { status: 'SKIPPED', skippedAt: new Date() },
  })
}

// ─── Cancel ───────────────────────────────────────────────────────────────────
export async function cancelEntry(restaurantId: string, entryId: string) {
  clearReminderTimer(entryId)
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, restaurantId },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })
}

// ─── Close restaurant ─────────────────────────────────────────────────────────
export async function closeRestaurant(restaurantId: string) {
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { status: 'CLOSED' },
  })
  return prisma.waitlistEntry.updateMany({
    where: { restaurantId, status: { in: ['WAITING', 'CALLED', 'CONFIRMED'] } },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })
}

// ─── Confirm (atomic) ─────────────────────────────────────────────────────────
// FIX: uses updateMany with status:'CALLED' filter so a concurrent expiry job
// cannot race-override an already-expired entry back to CONFIRMED.
// Returns { count: 1 } on success, { count: 0 } if entry is no longer CALLED.
export async function confirmEntry(entryId: string, restaurantId: string) {
  clearReminderTimer(entryId)
  const settings = await getRestaurantSettings(restaurantId)
  const now = new Date()
  return prisma.waitlistEntry.updateMany({
    where: { id: entryId, status: 'CALLED' },
    data: {
      status: 'CONFIRMED',
      confirmedAt: now,
      arrivalDeadlineAt: new Date(now.getTime() + settings.arrivalTimerSec * 1000),
    },
  })
}
