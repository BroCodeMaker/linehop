// In-memory map of entryId → pending reminder timeout
const reminderTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleReminder(entryId: string, delayMs: number, fn: () => void) {
  clearReminderTimer(entryId)
  const t = setTimeout(() => {
    reminderTimers.delete(entryId)
    fn()
  }, delayMs)
  reminderTimers.set(entryId, t)
}

export function clearReminderTimer(entryId: string) {
  const t = reminderTimers.get(entryId)
  if (t) {
    clearTimeout(t)
    reminderTimers.delete(entryId)
  }
}
