"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

type EntryData = {
  status: string;
  partySize: number;
  guestName?: string;
  restaurantName: string;
  position?: number;
  confirmDeadlineAt?: string;
  arrivalDeadlineAt?: string;
};

const FOOD_BG = `radial-gradient(ellipse at 10% 20%, rgba(251,146,60,0.10) 0%, transparent 50%),
  radial-gradient(ellipse at 90% 80%, rgba(234,179,8,0.08) 0%, transparent 50%), #fdf6ee`;

function useCountdown(deadline?: string) {
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) { setSecs(null); return; }
    const update = () => setSecs(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  return secs;
}

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = circ * (seconds / total);
  const color = seconds > 120 ? "#16a34a" : seconds > 30 ? "#ea580c" : "#dc2626";
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return (
    <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 12px" }}>
      <svg width={110} height={110} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={55} cy={55} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s, stroke 0.5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{m}:{s.toString().padStart(2, "0")}</span>
        <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>min</span>
      </div>
    </div>
  );
}

function statusStyle(st: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    WAITING:          { bg: "#fef3c7", color: "#92400e" },
    CALLED:           { bg: "#fed7aa", color: "#9a3412" },
    CONFIRMED:        { bg: "#dcfce7", color: "#166534" },
    SEATED:           { bg: "#dbeafe", color: "#1e40af" },
    NO_SHOW_CONFIRM:  { bg: "#fee2e2", color: "#991b1b" },
    NO_SHOW_ARRIVAL:  { bg: "#fee2e2", color: "#991b1b" },
    CANCELED:         { bg: "#f3f4f6", color: "#6b7280" },
    SKIPPED:          { bg: "#f3f4f6", color: "#6b7280" },
  };
  const c = map[st] ?? { bg: "#f3f4f6", color: "#6b7280" };
  return { display: "inline-block", padding: "10px 26px", borderRadius: "999px", fontWeight: 700, fontSize: "17px", ...c, marginBottom: "16px" };
}

export default function StatusPage() {
  const { publicToken } = useParams<{ publicToken: string }>();
  const { t } = useTranslation();
  const [data, setData] = useState<EntryData | null>(null);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const confirmSecs = useCountdown(data?.status === "CALLED" ? data.confirmDeadlineAt : undefined);
  const arrivalSecs = useCountdown(data?.status === "CONFIRMED" ? data.arrivalDeadlineAt : undefined);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/entry/${publicToken}`);
      if (!res.ok) { setError(t("status_not_found")); return; }
      setData(await res.json());
    } catch { setError(t("status_network_error")); }
  }, [publicToken, t]);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 15000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await fetch(`/api/public/entry/${publicToken}/confirm`, { method: "POST" });
      await fetchStatus();
    } finally { setConfirming(false); }
  }

  async function handleCancel() {
    setShowCancelModal(false);
    setCanceling(true);
    try {
      const res = await fetch(`/api/public/entry/${publicToken}/cancel`, { method: "POST" });
      if (res.ok) await fetchStatus();
    } finally { setCanceling(false); }
  }

  if (error) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <div style={s.card}><p style={{ color: "#dc2626", textAlign: "center" }}>{error}</p></div>
    </div>
  );
  if (!data) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <div style={s.card}><p style={s.muted}>{t("join_loading")}</p></div>
    </div>
  );

  const isActive = ["WAITING", "CALLED", "CONFIRMED"].includes(data.status);

  return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
        <LocaleSwitcher />
      </div>
      <div style={s.card}>
        <div style={s.restName}>{data.restaurantName}</div>
        <div style={s.guest}>
          {data.guestName && <>👤 {data.guestName} · </>}👥 {data.partySize} {data.partySize === 1 ? t("join_person") : t("join_persons")}
        </div>

        <div style={statusStyle(data.status)}>
          {t(`status_badge_${data.status}`) || data.status}
        </div>

        {data.status === "WAITING" && data.position != null && (
          <div style={s.posBlock}>
            <div style={s.posNum}>{data.position === 1 ? "1" : data.position - 1}</div>
            <div style={s.posLbl}>
              {data.position === 1
                ? <span style={{ whiteSpace: "pre-line" }}>{t("status_first_in_line")}</span>
                : `${data.position - 1} ${data.position - 1 === 1 ? t("status_group_before") : t("status_groups_before")}`}
            </div>
          </div>
        )}

        {data.status === "WAITING" && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", fontSize: "14px", fontWeight: 600, color: "#166534", textAlign: "center", margin: "0 0 12px" }}>
            {t("status_waiting_msg")}
          </div>
        )}

        {data.status === "CALLED" && (
          <div>
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 600, color: "#166534", textAlign: "center", margin: "0 0 10px" }}>
              {t("status_whatsapp_sent")}
            </div>
            <p style={{ textAlign: "center", fontSize: 14, color: "#9a3412", fontWeight: 600, margin: "0 0 12px" }}>
              {t("status_confirm_prompt")}
            </p>
            {confirmSecs != null && <CountdownRing seconds={confirmSecs} total={120} />}
            <button onClick={handleConfirm} disabled={confirming} style={s.confirmBtn}>
              {confirming ? t("status_confirming") : t("status_confirm_btn")}
            </button>
          </div>
        )}

        {data.status === "CONFIRMED" && (
          <div>
            {arrivalSecs != null && arrivalSecs > 0 && <CountdownRing seconds={arrivalSecs} total={300} />}
            <div style={s.successBox}>{t("status_hurry")}</div>
          </div>
        )}

        {data.status === "SEATED" && (
          <div style={s.successBox}>{t("status_enjoy")}</div>
        )}

        {data.status === "NO_SHOW_CONFIRM" && (
          <div style={s.warnBox}>{t("status_no_show_confirm_msg")}</div>
        )}

        {data.status === "NO_SHOW_ARRIVAL" && (
          <div style={s.warnBox}>{t("status_no_show_arrival_msg")}</div>
        )}

        {data.status === "CANCELED" && (
          <div style={{ ...s.warnBox, background: "#f3f4f6", color: "#6b7280", borderColor: "#e5e7eb" }}>
            {t("status_canceled_msg")}
          </div>
        )}

        {data.status === "SKIPPED" && (
          <div style={s.warnBox}>{t("status_skipped_msg")}</div>
        )}

        {isActive && (
          <button onClick={() => setShowCancelModal(true)} disabled={canceling} style={s.cancelBtn}>
            {canceling ? t("status_canceling") : t("status_cancel_btn")}
          </button>
        )}

        {isActive && <p style={s.refresh}>{t("status_auto_refresh")}</p>}

        <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#9ca3af", borderTop: "1px solid #f3f4f6", marginTop: 24 }}>
          LineHop™ 2026
        </div>
      </div>

      {showCancelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCancelModal(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 380, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", marginBottom: 12 }}>{t("status_cancel_modal_title")}</div>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.5 }}>
              {t("status_cancel_modal_body")}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ padding: "10px 24px", background: "transparent", color: "#6b7280", border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
              >
                {t("status_cancel_modal_no")}
              </button>
              <button
                onClick={handleCancel}
                style={{ padding: "10px 24px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >
                {t("status_cancel_modal_yes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FoodDecorations() {
  const items = ["🍕", "🍝", "🥗", "🍷", "🥩", "🍰", "🫕", "🥂"];
  const pos = [
    { top: "3%", left: "2%", size: 40, op: 0.11, rot: -15 },
    { top: "5%", right: "3%", size: 36, op: 0.10, rot: 20 },
    { top: "35%", left: "-1%", size: 30, op: 0.08, rot: 10 },
    { top: "60%", right: "0%", size: 34, op: 0.09, rot: -20 },
    { bottom: "8%", left: "3%", size: 32, op: 0.09, rot: 15 },
    { bottom: "3%", right: "4%", size: 38, op: 0.11, rot: -10 },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {pos.map((p, i) => (
        <div key={i} style={{ position: "absolute", fontSize: p.size, opacity: p.op, transform: `rotate(${p.rot}deg)`, top: p.top, right: (p as { right?: string }).right, bottom: p.bottom, left: p.left }}>
          {items[i % items.length]}
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "system-ui, sans-serif", position: "relative" },
  card: { background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)", borderRadius: "20px", padding: "32px 24px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", position: "relative", zIndex: 1, textAlign: "center" },
  restName: { fontSize: "22px", fontWeight: 800, color: "#1a1a1a", marginBottom: "4px" },
  guest: { fontSize: "14px", color: "#6b7280", marginBottom: "12px" },
  posBlock: { background: "#fff8f0", border: "1.5px solid #fed7aa", borderRadius: "14px", padding: "20px 16px", margin: "0 0 16px" },
  posNum: { fontSize: "64px", fontWeight: 900, color: "#ea580c", lineHeight: 1 },
  posLbl: { fontSize: "15px", color: "#9a3412", fontWeight: 600, marginTop: "4px" },
  confirmBtn: { display: "block", width: "100%", padding: "16px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.3)", marginBottom: "8px" },
  successBox: { background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#166534", borderRadius: "10px", padding: "14px 16px", fontSize: "15px", fontWeight: 600, margin: "8px 0" },
  warnBox: { background: "#fee2e2", border: "1.5px solid #fecaca", color: "#991b1b", borderRadius: "10px", padding: "14px 16px", fontSize: "14px", fontWeight: 600, margin: "8px 0" },
  cancelBtn: { marginTop: "20px", padding: "11px 24px", background: "transparent", color: "#ef4444", border: "1.5px solid #fecaca", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  muted: { fontSize: "13px", color: "#9ca3af", textAlign: "center" },
  refresh: { fontSize: "11px", color: "#d1d5db", marginTop: "20px" },
};
