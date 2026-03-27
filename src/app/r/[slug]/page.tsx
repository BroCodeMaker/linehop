"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { APP_VERSION } from "@/lib/version";

type RestaurantInfo = {
  name: string;
  status: "OPEN" | "FULL" | "CLOSED" | "PAUSED";
  listClosed: boolean;
  queueLength: number;
  estimatedWaitMinutes: number;
  waitMinutesPerGroup: number;
  maxPartySize: number;
  maxQueueSize: number;
  queueFull: boolean;
};

const FOOD_BG = `radial-gradient(ellipse at 10% 20%, rgba(251,146,60,0.10) 0%, transparent 50%),
  radial-gradient(ellipse at 90% 80%, rgba(234,179,8,0.08) 0%, transparent 50%),
  #fdf6ee`;

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [info, setInfo] = useState<RestaurantInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [partySize, setPartySize] = useState(2);
  const [phone, setPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);

  async function fetchInfo() {
    try {
      const res = await fetch(`/api/public/restaurants/${slug}/info`);
      if (res.ok) setInfo(await res.json());
    } finally {
      setLoadingInfo(false);
    }
  }

  useEffect(() => {
    fetchInfo();
    const timer = setInterval(fetchInfo, 20000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/restaurants/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partySize, phone, guestName: guestName || undefined, note: note || undefined, gdprConsent }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.blocked) {
          setError(t("join_phone_blocked"));
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }
      router.push(data.statusUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInfo) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <div style={s.card}><p style={s.muted}>{t("join_loading")}</p></div>
    </div>
  );

  if (!info) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <div style={s.card}><p style={{ color: "#dc2626" }}>{t("join_not_found")}</p></div>
    </div>
  );

  if (info.status === "CLOSED") return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <LocaleSwitcherFloat />
      <div style={s.card}>
        <div style={s.headerEmoji}>🌙</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#f3f4f6", color: "#6b7280" }}>{t("join_closed_title")}</div>
        <p style={s.muted}>{t("join_closed_msg")}</p>
      </div>
    </div>
  );

  if (info.status === "PAUSED") return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <LocaleSwitcherFloat />
      <div style={s.card}>
        <div style={s.headerEmoji}>⏸️</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#fef3c7", color: "#92400e" }}>{t("join_paused_title")}</div>
        <p style={s.muted}>{t("join_paused_msg")}</p>
      </div>
    </div>
  );

  if (info.listClosed) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <LocaleSwitcherFloat />
      <div style={s.card}>
        <div style={s.headerEmoji}>🔒</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#f3f4f6", color: "#374151" }}>{t("join_list_closed_title")}</div>
        <p style={s.muted}>{t("join_list_closed_msg")}</p>
      </div>
    </div>
  );

  if (info.queueFull) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <LocaleSwitcherFloat />
      <div style={s.card}>
        <div style={s.headerEmoji}>⏳</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#fee2e2", color: "#991b1b" }}>
          {t("join_queue_full_title")}
        </div>
        <p style={{ fontSize: 15, color: "#374151", textAlign: "center", margin: "16px 0", lineHeight: 1.6 }}>
          {t("join_queue_full_body").replace("{count}", String(info.queueLength))}
        </p>
        <p style={s.muted}>
          {t("join_queue_full_msg")}
        </p>
      </div>
    </div>
  );

  if (info.status === "OPEN") return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <LocaleSwitcherFloat />
      <div style={s.card}>
        <div style={s.headerEmoji}>🍽️</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#fef3c7", color: "#92400e" }}>
          {t("join_open_title")}
        </div>
        <p style={{ fontSize: 15, color: "#374151", textAlign: "center", margin: "16px 0" }}>
          {t("join_open_msg")}
        </p>
      </div>
    </div>
  );

  // FULL — show waitlist form
  return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <LocaleSwitcherFloat />
      <div style={s.card}>
        <div style={s.headerEmoji}>🍽️</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#fef3c7", color: "#92400e" }}>{t("join_full_title")}</div>

        <div style={s.queueInfo}>
          <div style={s.qStat}>
            <span style={s.qNum}>{info.queueLength}</span>
            <span style={s.qLabel}>{t("join_queue_count")}</span>
          </div>
          <div style={s.qDivider} />
          <div style={s.qStat}>
            <span style={s.qNum}>~{info.estimatedWaitMinutes}</span>
            <span style={s.qLabel}>{t("join_estimated_wait")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>{t("join_party_size")}</label>
          <select value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} style={s.input} required>
            {Array.from({ length: info.maxPartySize ?? 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? t("join_person") : t("join_persons")}</option>
            ))}
          </select>

          <label style={s.label}>{t("join_phone")}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" style={s.input} required />

          <label style={s.label}>{t("join_name")}</label>
          <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder={t("join_name_placeholder")} style={s.input} />

          <label style={s.label}>{t("join_note")}</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("join_note_placeholder")} style={s.input} maxLength={200} />

          <label style={s.gdprLabel}>
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              required
              style={{ marginRight: 8, flexShrink: 0, accentColor: "#E87722", width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              Sunt de acord cu{" "}
              <a href="/politica-confidentialitate" target="_blank" rel="noopener noreferrer" style={{ color: "#E87722", textDecoration: "underline" }}>
                Politica de confidențialitate
              </a>
              {" "}*
            </span>
          </label>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" style={s.btn} disabled={submitting || !gdprConsent}>
            {submitting ? t("join_submitting") : `${t("join_submit")} →`}
          </button>
          <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: "10px 0 0" }}>
            🔒 Numărul tău este folosit DOAR pentru această notificare.
          </p>
        </form>

        {/* Trust indicators */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0 4px" }}>
          {[
            { icon: "⚡", text: "durează 10 secunde" },
            { icon: "📱", text: "notificare WhatsApp" },
            { icon: "🚶", text: "nu trebuie să aștepți la intrare" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <p style={s.muted}>{t("join_whatsapp_note")}</p>
        <p style={{ fontSize: 11, color: "#d1d5db", textAlign: "center", marginTop: 12 }}>v{APP_VERSION}</p>
      </div>
    </div>
  );
}

function LocaleSwitcherFloat() {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
      <LocaleSwitcher />
    </div>
  );
}

function FoodDecorations() {
  const items = ["🍕", "🍝", "🥗", "🍷", "🥩", "🍰", "🫕", "🥂"];
  const pos = [
    { top: "4%", left: "2%", size: 42, op: 0.13, rot: -15 },
    { top: "6%", right: "3%", size: 38, op: 0.11, rot: 20 },
    { top: "30%", left: "-1%", size: 32, op: 0.08, rot: 10 },
    { top: "65%", right: "0%", size: 36, op: 0.09, rot: -20 },
    { bottom: "8%", left: "4%", size: 34, op: 0.10, rot: 15 },
    { bottom: "4%", right: "3%", size: 40, op: 0.12, rot: -10 },
    { top: "48%", left: "0%", size: 28, op: 0.07, rot: 5 },
    { top: "52%", right: "1%", size: 30, op: 0.08, rot: -5 },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {pos.map((p, i) => (
        <div key={i} style={{ position: "absolute", fontSize: p.size, opacity: p.op, transform: `rotate(${p.rot}deg)`, top: p.top, right: (p as {right?: string}).right, bottom: p.bottom, left: p.left }}>
          {items[i % items.length]}
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Inter', system-ui, sans-serif", position: "relative" },
  card: { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", borderRadius: "24px", padding: "28px 24px", width: "100%", maxWidth: "440px", boxShadow: "0 12px 48px rgba(0,0,0,0.13)", position: "relative", zIndex: 1 },
  headerEmoji: { fontSize: 44, textAlign: "center" as const, marginBottom: 8 },
  title: { fontSize: "22px", fontWeight: 900, margin: "0 0 12px 0", textAlign: "center" as const, color: "#1a1a1a", letterSpacing: "-0.02em" },
  banner: { padding: "10px 16px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", textAlign: "center" as const, marginBottom: "16px", lineHeight: 1.5 },
  queueInfo: { display: "flex", alignItems: "center", background: "linear-gradient(135deg, #fff8f0, #fff3e8)", border: "2px solid #fed7aa", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(232,119,34,0.08)" },
  qStat: { display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1 },
  qNum: { fontSize: "44px", fontWeight: 900, color: "#E87722", lineHeight: 1, letterSpacing: "-0.03em" },
  qLabel: { fontSize: "11px", color: "#9a3412", marginTop: "6px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em", textAlign: "center" as const },
  qDivider: { width: "1.5px", height: "56px", background: "#fed7aa", margin: "0 10px" },
  form: { display: "flex", flexDirection: "column" as const, gap: "4px", marginBottom: "12px" },
  label: { fontSize: "12px", fontWeight: 700, color: "#374151", marginTop: "10px", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  input: { padding: "13px 14px", borderRadius: "12px", border: "1.5px solid #e5e7eb", fontSize: "16px", outline: "none", background: "#fafafa", marginBottom: "2px" },
  btn: { marginTop: "14px", padding: "17px", background: "linear-gradient(135deg, #E87722, #d96a18)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "17px", fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 20px rgba(232,119,34,0.35)", letterSpacing: "-0.01em" },
  muted: { fontSize: "13px", color: "#9ca3af", textAlign: "center" as const, marginTop: "12px" },
  error: { color: "#dc2626", fontSize: "13px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px" },
  gdprLabel: { display: "flex", alignItems: "flex-start", marginTop: 12, cursor: "pointer", gap: 0 },
};
