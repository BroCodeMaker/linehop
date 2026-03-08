export function normalizePhone(input: string): string {
  // Remove spaces and dashes
  const cleaned = input.replace(/[\s\-]/g, '')

  // Already in E.164 with +40
  if (cleaned.startsWith('+40')) return cleaned

  // 0040 international prefix
  if (cleaned.startsWith('0040')) return '+40' + cleaned.slice(4)

  // Local 07xx format -> +407xx
  if (cleaned.startsWith('0')) return '+40' + cleaned.slice(1)

  // Bare number without leading zero (e.g. 7xx) -> +407xx
  return '+40' + cleaned
}
