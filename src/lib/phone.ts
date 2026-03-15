export function normalizePhone(input: string): string {
  // Remove spaces, dashes, parentheses
  const cleaned = input.replace(/[\s\-()]/g, '')

  // Already in E.164 with +40
  if (cleaned.startsWith('+40')) return cleaned

  // 0040 international prefix
  if (cleaned.startsWith('0040')) return '+40' + cleaned.slice(4)

  // Already has country code 40 without + (e.g. 40750198891)
  if (cleaned.startsWith('40') && cleaned.length === 11) return '+' + cleaned

  // Local 07xx format -> +407xx
  if (cleaned.startsWith('0')) return '+40' + cleaned.slice(1)

  // Bare number without leading zero (e.g. 750198891) -> +407xx
  return '+40' + cleaned
}
