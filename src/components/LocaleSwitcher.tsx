"use client";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";

export default function LocaleSwitcher() {
  const { locale, changeLocale } = useTranslation();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#f3f4f6", borderRadius: 8, padding: "3px 4px" }}>
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => changeLocale(l)}
          style={{
            padding: "3px 8px",
            background: locale === l ? "#fff" : "transparent",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: locale === l ? 700 : 500,
            color: locale === l ? "#111" : "#6b7280",
            boxShadow: locale === l ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s",
            whiteSpace: "nowrap" as const,
          }}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
