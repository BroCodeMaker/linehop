export interface WaitlistEntryDto {
  id: string;
  publicToken: string;
  partySize: number;
  phoneE164: string;
  guestName?: string;
  status: "WAITING" | "CALLED" | "CONFIRMED" | "SEATED" | "SKIPPED" | "EXPIRED" | "CANCELED";
}
