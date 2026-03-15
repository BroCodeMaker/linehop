"use client";
import { useState, useEffect } from "react";
import { Locale, getLocale, setLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { translations } from "@/lib/translations";

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  function changeLocale(l: Locale) {
    setLocale(l);
    setLocaleState(l);
    window.location.reload();
  }

  function t(key: string): string {
    return (translations[locale] as Record<string, string>)[key] ??
           (translations["ro"] as Record<string, string>)[key] ?? key;
  }

  return { t, locale, changeLocale };
}
