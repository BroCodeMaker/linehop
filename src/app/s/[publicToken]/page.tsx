"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

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
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
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
        <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>rămase</span>
      </div>
    </div>
  );
}

function statusStyle(st: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    WAITING:   { bg: "#fef3c7", color: "#92400e" },
    CALLED:    { bg: "#fed7aa", color: "#9a3412" },
    CONFIRMED: { bg: "#dcfce7", color: "#166534" },
    SEATED:    { bg: "#dbeafe", color: "#1e40af" },
    EXPIRED:   { bg: "#fee2e2", color: "#991b1b" },
    CANCELED:  { bg: "#f3f4f6", color: "#6b7280" },
    SKIPPED:   { bg: "#f3f4f6", color: "#6b7280" },
  };
  const c = map[st] ?? map.WAITING;
  return { display: "inline-block", padding: "10px 26px", borderRadius: "999px", fontWeight: 700, fontSize: "17px", ...c, marginBottom: "16px" };
}

export default function StatusPage() {
  const { publicToken } = useParams<{ publicToken: string }>();
  const [data, setData] = useState<EntryData | null>(null);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const confirmSecs = useCountdown(data?.status === "CALLED" ? data.confirmDeadlineAt : undefined);
  const arrivalSecs = useCountdown(data?.status === "CONFIRMED" ? data.arrivalDeadlineAt : undefined);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/entry/${publicToken}`);
      if (!res.ok) { setError("Rezervarea nu a fost găsită."); return; }
      setData(await res.json());
    } catch { setError("Eroare de rețea."); }
  }, [publicToken]);

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 15000);
    return () => clearInterval(t);
  }, [fetchStatus]);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await fetch(`/api/public/entry/${publicToken}/confirm`, { method: "POST" });
      await fetchStatus();
    } finally { setConfirming(false); }
  }

  async function handleCancel() {
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
      <div style={s.card}><p style={s.muted}>Se încarcă...</p></div>
    </div>
  );

  const isActive = ["WAITING", "CALLED", "CONFIRMED"].includes(data.status);
  const etaMin = data.position ? data.position * 20 : null;

  return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <div style={s.card}>
        <div style={s.restName}>{data.restaurantName}</div>
        {data.guestName && (
          <div style={s.guest}>👤 {data.guestName} · {data.partySize} {data.partySize === 1 ? "persoană" : "persoane"}</div>
        )}

        <div style={statusStyle(data.status)}>
          {data.status === "WAITING" && "⏳ În așteptare"}
          {data.status === "CALLED" && "📲 Masa ta e gata!"}
          {data.status === "CONFIRMED" && "✅ Confirmat"}
          {data.status === "SEATED" && "🪑 La masă"}
          {data.status === "EXPIRED" && "⌛ Expirat"}
          {data.status === "CANCELED" && "❌ Anulat"}
          {data.status === "SKIPPED" && "⏭️ Sărit"}
        </div>

        {data.status === "WAITING" && data.position != null && (
          <div style={s.posBlock}>
            <div style={s.posNum}>{data.position}</div>
            <div style={s.posLbl}>
              {data.position === 1 ? "🎉 Ești primul!" : `grupuri înaintea ta`}
            </div>
            {etaMin != null && (
              <div style={s.eta}>⏱ ~{etaMin} minute estimat</div>
            )}
          </div>
        )}

        {data.status === "CALLED" && (
          <div>
            <p style={{ textAlign: "center", fontSize: 14, color: "#9a3412", fontWeight: 600, margin: "0 0 12px" }}>
              Confirmă că vii la restaurant!
            </p>
            {confirmSecs != null && <CountdownRing seconds={confirmSecs} total={120} />}
            <button onClick={handleConfirm} disabled={confirming} style={s.confirmBtn}>
              {confirming ? "Se confirmă..." : "✅ Confirm că vin!"}
            </button>
          </div>
        )}

        {data.status === "CONFIRMED" && (
          <div>
            {arrivalSecs != null && arrivalSecs > 0 && <CountdownRing seconds={arrivalSecs} total={300} />}
            <div style={s.successBox}>🏃 Vino cât mai repede! Masa îți este rezervată.</div>
          </div>
        )}

        {data.status === "SEATED" && (
          <div style={s.successBox}>🎉 Poftă bună! Bucurați-vă de masă.</div>
        )}

        {(data.status === "EXPIRED") && (
          <div style={s.warnBox}>⏰ Timpul de confirmare a expirat. Contactați personalul restaurantului.</div>
        )}

        {data.status === "CANCELED" && (
          <div style={{ ...s.warnBox, background: "#f3f4f6", color: "#6b7280", borderColor: "#e5e7eb" }}>
            Rezervarea a fost anulată.
          </div>
        )}

        {data.status === "SKIPPED" && (
          <div style={s.warnBox}>Ai fost sărit din coadă. Contactați personalul.</div>
        )}

        {isActive && (
          <button onClick={handleCancel} disabled={canceling} style={s.cancelBtn}>
            {canceling ? "Se anulează..." : "Anulează rezervarea"}
          </button>
        )}

        {isActive && <p style={s.refresh}>Auto-refresh la 15 sec</p>}
      </div>
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
  eta: { display: "inline-block", marginTop: "10px", padding: "6px 16px", background: "#fef3c7", color: "#92400e", borderRadius: "999px", fontSize: "13px", fontWeight: 700 },
  confirmBtn: { display: "block", width: "100%", padding: "16px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.3)", marginBottom: "8px" },
  successBox: { background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#166534", borderRadius: "10px", padding: "14px 16px", fontSize: "15px", fontWeight: 600, margin: "8px 0" },
  warnBox: { background: "#fee2e2", border: "1.5px solid #fecaca", color: "#991b1b", borderRadius: "10px", padding: "14px 16px", fontSize: "14px", fontWeight: 600, margin: "8px 0" },
  cancelBtn: { marginTop: "20px", padding: "11px 24px", background: "transparent", color: "#ef4444", border: "1.5px solid #fecaca", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  muted: { fontSize: "13px", color: "#9ca3af", textAlign: "center" },
  refresh: { fontSize: "11px", color: "#d1d5db", marginTop: "20px" },
};
