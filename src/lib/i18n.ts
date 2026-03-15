export type Locale = "ro" | "en" | "hu";
export const DEFAULT_LOCALE: Locale = "ro";
export const LOCALES: Locale[] = ["ro", "en", "hu"];
export const LOCALE_NAMES: Record<Locale, string> = { ro: "🇷🇴 RO", en: "🇬🇧 EN", hu: "🇭🇺 HU" };

export function getLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem("linehop_locale") as Locale;
  return LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
}

export function setLocale(l: Locale) {
  if (typeof window !== "undefined") localStorage.setItem("linehop_locale", l);
}
