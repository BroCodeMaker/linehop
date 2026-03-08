"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Entry = {
  id: string;
  partySize: number;
  phoneE164: string;
  guestName?: string;
  status: string;
  createdAt: string;
  calledAt?: string;
  confirmedAt?: string;
  confirmDeadlineAt?: string;
  arrivalDeadlineAt?: string;
};

type RestStatus = "OPEN" | "FULL" | "CLOSED";

const STATUS_COLORS: Record<string, string> = {
  WAITING:   "#fef3c7",
  CALLED:    "#fed7aa",
  CONFIRMED: "#dcfce7",
  SEATED:    "#dbeafe",
  SKIPPED:   "#f3f4f6",
  EXPIRED:   "#fee2e2",
  CANCELED:  "#f3f4f6",
};

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "acum";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function CountdownTimer({ deadline, totalSec }: { deadline: string; totalSec: number }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const update = () => setSecs(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  const m = Math.floor(secs / 60), s = secs % 60;
  const pct = secs / totalSec;
  const color = pct > 0.5 ? "#16a34a" : pct > 0.2 ? "#ea580c" : "#dc2626";
  return (
    <span style={{ fontWeight: 700, color, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}

const FOOD_BG = `radial-gradient(ellipse at 5% 0%, rgba(251,146,60,0.12) 0%, transparent 40%),
  radial-gradient(ellipse at 95% 100%, rgba(234,179,8,0.08) 0%, transparent 40%), #fdf6ee`;

export default function DashboardPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restStatus, setRestStatus] = useState<RestStatus>("OPEN");
  const [callingNext, setCallingNext] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "ok" | "info" } | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/queue`);
      const data = await res.json();
      if (data.ok) setEntries(data.entries);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const fetchRestStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/restaurants/_by_id/${restaurantId}/info`);
      if (res.ok) {
        const d = await res.json();
        setRestStatus(d.status);
      }
    } catch { /* ignore */ }
  }, [restaurantId]);

  useEffect(() => {
    fetchQueue();
    fetchRestStatus();
    const t = setInterval(() => { fetchQueue(); fetchRestStatus(); }, 10000);
    return () => clearInterval(t);
  }, [fetchQueue, fetchRestStatus]);

  async function handleSetStatus(newStatus: RestStatus) {
    if (newStatus === restStatus) return;
    if (newStatus === "CLOSED" && !confirm("Închizi restaurantul? Toți clienții din coadă vor fi notificați și lista se va goli.")) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setRestStatus(newStatus);
        await fetchQueue();
        if (newStatus === "CLOSED") setMessage({ text: "Restaurantul a fost închis. Clienții au fost notificați.", type: "info" });
        if (newStatus === "FULL") setMessage({ text: "Modul Waitlist activat. Clienții se pot înscrie în coadă.", type: "ok" });
        if (newStatus === "OPEN") setMessage({ text: "Modul normal activat. Clienții intră direct.", type: "info" });
      }
    } finally {
      setChangingStatus(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function handleCallNext() {
    setCallingNext(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/call-next`, { method: "POST" });
      const data = await res.json();
      if (data.ok && data.entry) {
        setMessage({ text: `✅ Chemat: ${data.entry.guestName ?? data.entry.phoneE164} (${data.entry.partySize} pers.)`, type: "ok" });
      } else {
        setMessage({ text: "ℹ️ Nu mai sunt clienți în așteptare", type: "info" });
      }
      await fetchQueue();
    } finally {
      setCallingNext(false);
    }
  }

  async function handleAction(entryId: string, action: "seat" | "skip") {
    await fetch(`/api/restaurants/${restaurantId}/entries/${entryId}/${action}`, { method: "POST" });
    await fetchQueue();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app/login");
  }

  const waiting = entries.filter(e => e.status === "WAITING").length;
  const called = entries.filter(e => e.status === "CALLED").length;
  const confirmed = entries.filter(e => e.status === "CONFIRMED").length;

  return (
    <div style={{ minHeight: "100vh", background: FOOD_BG, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>🍽️ Queue Dashboard</span>
        </div>
        <div style={s.headerRight}>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={s.body}>
        {/* Restaurant Status Toggle */}
        <div style={s.statusCard}>
          <div style={s.statusLabel}>Status Restaurant</div>
          <div style={s.statusRow}>
            {(["OPEN", "FULL", "CLOSED"] as RestStatus[]).map((st) => {
              const cfg: Record<RestStatus, { label: string; active: string; icon: string }> = {
                OPEN:   { label: "Deschis", active: "#16a34a", icon: "🟢" },
                FULL:   { label: "Plin / Waitlist", active: "#ea580c", icon: "🔴" },
                CLOSED: { label: "Închis", active: "#6b7280", icon: "🌙" },
              };
              const c = cfg[st];
              const isActive = restStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => handleSetStatus(st)}
                  disabled={changingStatus}
                  style={{
                    ...s.statusBtn,
                    background: isActive ? c.active : "#fff",
                    color: isActive ? "#fff" : "#6b7280",
                    border: isActive ? `2px solid ${c.active}` : "2px solid #e5e7eb",
                    boxShadow: isActive ? `0 2px 12px ${c.active}44` : "none",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {c.icon} {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={{ ...s.statBox, background: "#fef3c7", color: "#92400e" }}>
            <span style={s.statNum}>{waiting}</span>
            <span style={s.statLbl}>⏳ așteptare</span>
          </div>
          <div style={{ ...s.statBox, background: "#fed7aa", color: "#9a3412" }}>
            <span style={s.statNum}>{called}</span>
            <span style={s.statLbl}>📲 chemat</span>
          </div>
          <div style={{ ...s.statBox, background: "#dcfce7", color: "#166534" }}>
            <span style={s.statNum}>{confirmed}</span>
            <span style={s.statLbl}>✅ confirmat</span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{ ...s.msgBox, background: message.type === "ok" ? "#f0fdf4" : "#fff8f0", color: message.type === "ok" ? "#166534" : "#9a3412", borderColor: message.type === "ok" ? "#bbf7d0" : "#fed7aa" }}>
            {message.text}
          </div>
        )}

        {/* Call Next Button */}
        <button
          onClick={handleCallNext}
          disabled={callingNext || waiting === 0 || restStatus === "CLOSED"}
          style={{ ...s.callBtn, opacity: (waiting === 0 || restStatus === "CLOSED") ? 0.4 : 1 }}
        >
          {callingNext ? "Se cheamă..." : "📣 CHEAMĂ URMĂTORUL"}
        </button>

        {/* Queue Table */}
        {loading ? (
          <p style={s.muted}>Se încarcă coada...</p>
        ) : entries.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: 48 }}>🎉</div>
            <p>Coada este goală</p>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["#", "Nume", "Pers.", "Telefon", "Status", "Timp", "Acțiuni"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.id} style={{ background: STATUS_COLORS[entry.status] ?? "#fff" }}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={s.td}><strong>{entry.guestName ?? "—"}</strong></td>
                    <td style={s.td}>{entry.partySize}</td>
                    <td style={s.td}><span style={s.phone}>{entry.phoneE164}</span></td>
                    <td style={s.td}>
                      <span style={s.badge}>{entry.status}</span>
                      {entry.status === "CALLED" && entry.confirmDeadlineAt && (
                        <div style={{ marginTop: 4 }}>
                          <CountdownTimer deadline={entry.confirmDeadlineAt} totalSec={120} />
                        </div>
                      )}
                      {entry.status === "CONFIRMED" && entry.arrivalDeadlineAt && (
                        <div style={{ marginTop: 4 }}>
                          <CountdownTimer deadline={entry.arrivalDeadlineAt} totalSec={300} />
                        </div>
                      )}
                    </td>
                    <td style={s.td}>{timeAgo(entry.createdAt)}</td>
                    <td style={s.td}>
                      {["WAITING", "CALLED", "CONFIRMED"].includes(entry.status) && (
                        <>
                          <button onClick={() => handleAction(entry.id, "seat")} style={{ ...s.actionBtn, background: "#2563eb" }}>
                            Seat
                          </button>
                          <button onClick={() => handleAction(entry.id, "skip")} style={{ ...s.actionBtn, background: "#9ca3af" }}>
                            Skip
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={s.refresh}>Auto-refresh la 10 secunde</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #f0e8dc", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  logo: { fontSize: "18px", fontWeight: 800, color: "#1a1a1a" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  logoutBtn: { padding: "6px 14px", background: "transparent", color: "#9ca3af", border: "1.5px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 },
  body: { padding: "20px 16px", maxWidth: 1100, margin: "0 auto" },
  statusCard: { background: "rgba(255,255,255,0.95)", borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  statusLabel: { fontSize: "12px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "10px" },
  statusRow: { display: "flex", gap: "8px", flexWrap: "wrap" as const },
  statusBtn: { padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", transition: "all 0.2s", flex: 1, minWidth: "120px" },
  statsRow: { display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" as const },
  statBox: { flex: 1, minWidth: "80px", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column" as const, alignItems: "center" },
  statNum: { fontSize: "32px", fontWeight: 800, lineHeight: 1 },
  statLbl: { fontSize: "12px", fontWeight: 600, marginTop: "4px" },
  msgBox: { border: "1.5px solid", borderRadius: "10px", padding: "10px 16px", marginBottom: "12px", fontSize: "14px", fontWeight: 600 },
  callBtn: { display: "block", width: "100%", padding: "16px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "17px", fontWeight: 700, cursor: "pointer", marginBottom: "16px", boxShadow: "0 4px 16px rgba(22,163,74,0.25)" },
  emptyState: { textAlign: "center" as const, padding: "48px 0", color: "#9ca3af", fontSize: "16px" },
  tableWrap: { overflowX: "auto" as const, background: "rgba(255,255,255,0.95)", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" },
  th: { textAlign: "left" as const, padding: "12px 14px", borderBottom: "2px solid #f0e8dc", fontWeight: 700, color: "#374151", background: "rgba(253,246,238,0.8)", fontSize: "13px" },
  td: { padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.04)", verticalAlign: "middle" as const },
  phone: { fontFamily: "monospace", fontSize: "12px", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" },
  badge: { fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(0,0,0,0.06)" },
  actionBtn: { padding: "5px 12px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#fff", marginRight: "6px" },
  muted: { color: "#9ca3af", padding: "32px 0", textAlign: "center" as const },
  refresh: { fontSize: "11px", color: "#d1d5db", textAlign: "center" as const, marginTop: "24px" },
};
