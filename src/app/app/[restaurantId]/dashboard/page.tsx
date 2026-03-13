"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import AdminNav from "@/components/AdminNav";
import { APP_VERSION } from "@/lib/version";

type Entry = {
  id: string;
  partySize: number;
  phoneE164: string;
  guestName?: string;
  status: string;
  notes?: string;
  createdAt: string;
  calledAt?: string;
  confirmedAt?: string;
  seatedAt?: string;
  skippedAt?: string;
  confirmDeadlineAt?: string;
  arrivalDeadlineAt?: string;
  expiredAt?: string;
  callAgainCount?: number;
};

type RestStatus = "OPEN" | "FULL" | "PAUSED" | "CLOSED";

type Stats = {
  waitingNow: number;
  avgWaitMinutes: number | null;
  seatedTonight: number;
  confirmRate: number | null;
};

const FOOD_BG = `radial-gradient(ellipse at 5% 0%, rgba(251,146,60,0.12) 0%, transparent 40%),
  radial-gradient(ellipse at 95% 100%, rgba(234,179,8,0.08) 0%, transparent 40%), #fdf6ee`;

// Row background colors per status
function rowBg(status: string): string {
  switch (status) {
    case "CALLED":         return "#fff7ed"; // orange tint
    case "CONFIRMED":      return "#f0fdf4"; // green tint
    case "WAITING":        return "#fff";
    case "NO_SHOW_CONFIRM":return "#fee2e2";
    case "NO_SHOW_ARRIVAL":return "#fff7ed";
    case "SEATED":         return "#f0f9ff";
    case "SKIPPED":        return "#fafafa";
    default:               return "#f9fafb";
  }
}

// Row left border color per status
function rowBorder(status: string): string {
  switch (status) {
    case "CALLED":          return "4px solid #fb923c";
    case "CONFIRMED":       return "4px solid #4ade80";
    case "WAITING":         return "4px solid #e5e7eb";
    case "NO_SHOW_CONFIRM": return "4px solid #f87171";
    case "NO_SHOW_ARRIVAL": return "4px solid #fdba74";
    case "SEATED":          return "4px solid #38bdf8";
    case "SKIPPED":         return "4px solid #d1d5db";
    default:                return "4px solid #e5e7eb";
  }
}

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "acum";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function WaitingTime({ createdAt }: { createdAt: string }) {
  const now = useNow(60000);
  const ms = now - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return <span style={{ fontSize: 11, color: "#9ca3af" }}>⏱ {label}</span>;
}

function CountdownTimer({ deadline, totalSec }: { deadline: string; totalSec: number }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const update = () => setSecs(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  const m = Math.floor(secs / 60), sc = secs % 60;
  const isLast60 = secs <= 60;
  return (
    <span style={{
      fontWeight: 700,
      color: isLast60 ? "#dc2626" : "#374151",
      fontVariantNumeric: "tabular-nums",
      fontSize: 13,
      animation: isLast60 ? "pulse 1s ease-in-out infinite" : undefined,
    }}>
      {m}:{sc.toString().padStart(2, "0")}
    </span>
  );
}

function BufferTimer({ expiredAt }: { expiredAt: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const expiry = new Date(expiredAt).getTime() + 10 * 60 * 1000;
    const update = () => setSecs(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiredAt]);
  const m = Math.floor(secs / 60), sc = secs % 60;
  return <span style={{ fontSize: 11, color: "#9ca3af" }}>ascuns în {m}:{sc.toString().padStart(2, "0")}</span>;
}

// Suppress unused import warning
void timeAgo;

export default function DashboardPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  // null = not yet loaded from DB (prevents highlight flicker on refresh)
  const [restStatus, setRestStatus] = useState<RestStatus | null>(null);
  const [listClosed, setListClosed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [callingNext, setCallingNext] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "ok" | "info" } | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ guestName: "", partySize: 2, phoneE164: "", notes: "" });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInNotes, setWalkInNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ guestName: string; partySize: number; phoneE164: string }>({ guestName: "", partySize: 2, phoneE164: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [restaurantSlug, setRestaurantSlug] = useState<string>("");
  const [togglingList, setTogglingList] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

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
      const res = await fetch(`/api/public/restaurants/by-id/${restaurantId}/info`);
      if (res.ok) {
        const d = await res.json();
        setRestStatus(d.status);
        setListClosed(d.listClosed ?? false);
      }
    } catch { /* ignore */ }
  }, [restaurantId]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/stats`);
      if (res.ok) {
        const d = await res.json();
        setStats(d);
      }
    } catch { /* ignore */ }
  }, [restaurantId]);

  const refreshAll = useCallback(() => {
    fetchQueue();
    fetchRestStatus();
    fetchStats();
  }, [fetchQueue, fetchRestStatus, fetchStats]);

  // SSE setup
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const es = new EventSource(`/api/restaurants/${restaurantId}/stream`);
      sseRef.current = es;
      es.addEventListener('connected', () => setSseConnected(true));
      es.addEventListener('update', () => refreshAll());
      es.onerror = () => {
        setSseConnected(false);
        es.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    const poll = setInterval(refreshAll, 5000);

    return () => {
      sseRef.current?.close();
      clearTimeout(reconnectTimer);
      clearInterval(poll);
    };
  }, [restaurantId, refreshAll]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

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
        await refreshAll();
        const msgs: Record<string, string> = {
          CLOSED: "Restaurantul a fost închis. Clienții au fost notificați.",
          FULL: "Modul Waitlist activat. Clienții se pot înscrie în coadă.",
          OPEN: "Modul normal activat. Clienții intră direct.",
          PAUSED: "Waitlist-ul este în pauză. Coada existentă rămâne intactă.",
        };
        setMessage({ text: msgs[newStatus] || "", type: newStatus === "FULL" ? "ok" : "info" });
      }
    } finally {
      setChangingStatus(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function handleToggleList() {
    setTogglingList(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/toggle-list`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setListClosed(data.listClosed);
        setMessage({
          text: data.listClosed ? "🔒 Lista de așteptare a fost închisă." : "🔓 Lista de așteptare a fost deschisă.",
          type: "info",
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setTogglingList(false);
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
      await refreshAll();
    } finally {
      setCallingNext(false);
    }
  }

  async function handleAction(entryId: string, action: string) {
    const res = await fetch(`/api/restaurants/${restaurantId}/entries/${entryId}/${action}`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMessage({ text: `❌ ${d.error ?? "Eroare"}`, type: "info" });
      setTimeout(() => setMessage(null), 3000);
    }
    await refreshAll();
  }

  async function handleUndo(entryId: string, action: "undo-seated" | "undo-skipped" | "re-call") {
    const res = await fetch(`/api/restaurants/${restaurantId}/entries/${entryId}/${action}`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      const labels = { "undo-seated": "↩️ Undo seated", "undo-skipped": "↩️ Undo skipped", "re-call": "📲 Re-call trimis" };
      setMessage({ text: `✅ ${labels[action]}`, type: "ok" });
    } else {
      setMessage({ text: `❌ ${data.error ?? "Eroare"}`, type: "info" });
    }
    setTimeout(() => setMessage(null), 3000);
    await refreshAll();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app/login");
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/entries/add-manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: manualForm.guestName,
          partySize: manualForm.partySize,
          phoneE164: manualForm.phoneE164 || undefined,
          notes: manualForm.notes || undefined,
        }),
      });
      if (res.ok) {
        setShowManualForm(false);
        setManualForm({ guestName: "", partySize: 2, phoneE164: "", notes: "" });
        await refreshAll();
        setMessage({ text: "✅ Grup adăugat manual", type: "ok" });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setManualSubmitting(false);
    }
  }

  async function handleWalkIn(partySize: number) {
    setShowWalkIn(false);
    await fetch(`/api/restaurants/${restaurantId}/entries/walk-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partySize, notes: walkInNotes || undefined }),
    });
    setWalkInNotes("");
    await refreshAll();
    setMessage({ text: `✅ Walk-in ${partySize} pers. înregistrat`, type: "ok" });
    setTimeout(() => setMessage(null), 3000);
  }

  async function openQR() {
    try {
      const res = await fetch(`/api/public/restaurants/by-id/${restaurantId}/info`);
      const data = await res.json();
      const slug = data.slug ?? restaurantId;
      setRestaurantSlug(slug);
      const joinUrl = `${window.location.origin}/r/${slug}`;
      const dataUrl = await QRCode.toDataURL(joinUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setShowQR(true);
    } catch {
      setMessage({ text: "❌ Nu s-a putut genera QR codul", type: "info" });
    }
  }

  function downloadQR() {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `waitlist-qr-${restaurantSlug}.png`;
    a.click();
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditForm({
      guestName: entry.guestName ?? "",
      partySize: entry.partySize,
      phoneE164: entry.phoneE164,
    });
  }

  async function handleEditSave(entryId: string) {
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/entries/${entryId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        await refreshAll();
        setMessage({ text: "✅ Entry actualizat", type: "ok" });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setEditSubmitting(false);
    }
  }

  const waiting = entries.filter(e => e.status === "WAITING").length;
  const called = entries.filter(e => e.status === "CALLED").length;
  const confirmed = entries.filter(e => e.status === "CONFIRMED").length;

  // Split entries into active queue and recent undo-able entries
  const activeEntries = entries.filter(e => !["SEATED", "SKIPPED"].includes(e.status));
  const recentEntries = entries.filter(e => ["SEATED", "SKIPPED"].includes(e.status));

  const statusCfg: Record<string, { label: string; active: string; icon: string }> = {
    OPEN:   { label: "Deschis",         active: "#16a34a", icon: "🟢" },
    FULL:   { label: "Plin / Waitlist", active: "#ea580c", icon: "🔴" },
    PAUSED: { label: "Pauză",           active: "#d97706", icon: "⏸️" },
    CLOSED: { label: "Închis",          active: "#6b7280", icon: "🌙" },
  };

  // Suppress unused warning
  void handleLogout;

  return (
    <div style={{ minHeight: "100vh", background: FOOD_BG, fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Nav */}
      <AdminNav restaurantId={restaurantId} />

      {/* Live status indicator */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f3f4f6", padding: "6px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: sseConnected ? "#16a34a" : "#ef4444" }}>
          {sseConnected ? "🟢 Live" : "🔴 Reconnecting..."}
        </span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Queue Dashboard</span>
        <span style={{ fontSize: 11, color: "#d1d5db", marginLeft: "auto" }}>v{APP_VERSION}</span>
      </div>

      <div style={s.body}>
        {/* Restaurant Status Toggle */}
        <div style={s.statusCard}>
          <div style={s.statusLabel}>Status Restaurant</div>
          <div style={s.statusRow}>
            {(["OPEN", "FULL", "PAUSED", "CLOSED"] as RestStatus[]).map((st) => {
              const c = statusCfg[st];
              const isActive = restStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => handleSetStatus(st)}
                  disabled={changingStatus || restStatus === null}
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

          {/* Lista Închisă toggle */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleToggleList}
              disabled={togglingList}
              style={{
                padding: "8px 16px",
                background: listClosed ? "#1f2937" : "#f9fafb",
                color: listClosed ? "#fff" : "#374151",
                border: `2px solid ${listClosed ? "#1f2937" : "#e5e7eb"}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {listClosed ? "🔓 Deschide lista" : "🔒 Închide lista"}
            </button>
            {listClosed && (
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                Clienții noi nu pot intra în coadă
              </span>
            )}
          </div>
        </div>

        {/* Stats Bar (live metrics) */}
        <div style={s.statsRow}>
          <div style={{ ...s.statBox, background: "#fef3c7", color: "#92400e" }}>
            <span style={s.statLbl}>⏳ Waiting now</span>
            <span style={s.statNum}>{stats?.waitingNow ?? waiting}</span>
          </div>
          <div style={{ ...s.statBox, background: "#fed7aa", color: "#9a3412" }}>
            <span style={s.statLbl}>🪑 Avg turnover</span>
            <span style={s.statNum}>
              {stats?.avgWaitMinutes != null ? `${stats.avgWaitMinutes}m` : "—"}
            </span>
          </div>
          <div style={{ ...s.statBox, background: "#dcfce7", color: "#166534" }}>
            <span style={s.statLbl}>🪑 Seated tonight</span>
            <span style={s.statNum}>{stats?.seatedTonight ?? 0}</span>
          </div>
          <div style={{ ...s.statBox, background: "#ede9fe", color: "#5b21b6" }}>
            <span style={s.statLbl}>✅ Confirm rate</span>
            <span style={s.statNum}>
              {stats?.confirmRate != null ? `${stats.confirmRate}%` : "—"}
            </span>
          </div>
          <div style={{ ...s.statBox, background: "#fed7aa", color: "#9a3412" }}>
            <span style={s.statLbl}>📲 Chemat</span>
            <span style={s.statNum}>{called}</span>
          </div>
          <div style={{ ...s.statBox, background: "#dcfce7", color: "#166534" }}>
            <span style={s.statLbl}>✅ Confirmat</span>
            <span style={s.statNum}>{confirmed}</span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{ ...s.msgBox, background: message.type === "ok" ? "#f0fdf4" : "#fff8f0", color: message.type === "ok" ? "#166534" : "#9a3412", borderColor: message.type === "ok" ? "#bbf7d0" : "#fed7aa" }}>
            {message.text}
          </div>
        )}

        {/* Action Buttons Row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
          <button
            onClick={handleCallNext}
            disabled={callingNext || waiting === 0 || restStatus === "CLOSED"}
            style={{ ...s.callBtn, flex: 2, marginBottom: 0, minWidth: 160, opacity: (waiting === 0 || restStatus === "CLOSED") ? 0.4 : 1 }}
          >
            {callingNext ? "Se cheamă..." : "📣 CHEAMĂ URMĂTORUL"}
          </button>
          <button onClick={() => setShowManualForm(v => !v)} style={{ ...s.toolBtn, flex: 1, minWidth: 130 }}>
            ➕ Adaugă manual
          </button>
          <button onClick={() => setShowWalkIn(v => !v)} style={{ ...s.toolBtn, flex: 1, minWidth: 110, background: "#e0e7ff", color: "#3730a3", border: "2px solid #a5b4fc" }}>
            🚶 Walk-in
          </button>
          <button onClick={openQR} style={{ ...s.toolBtn, flex: 1, minWidth: 110, background: "#f0fdf4", color: "#166534", border: "2px solid #86efac" }}>
            📱 QR Code
          </button>
          <button onClick={async () => {
            if (!confirm("Ștergi toată coada? (doar pentru teste)")) return;
            await fetch(`/api/restaurants/${restaurantId}/reset-test`, { method: "POST" });
            fetchQueue();
          }} style={{ ...s.toolBtn, flex: 1, minWidth: 110, background: "#fff1f2", color: "#be123c", border: "2px solid #fda4af" }}>
            🗑️ Reset Test
          </button>
        </div>

        {/* Manual Add Form */}
        {showManualForm && (
          <div style={s.manualForm}>
            <form onSubmit={handleManualAdd} style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "flex-end" }}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Nume *</label>
                <input value={manualForm.guestName} onChange={e => setManualForm(f => ({ ...f, guestName: e.target.value }))} placeholder="Nume grup" required style={s.formInput} />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Persoane *</label>
                <input type="number" min={1} max={20} value={manualForm.partySize} onChange={e => setManualForm(f => ({ ...f, partySize: Number(e.target.value) }))} style={{ ...s.formInput, width: 70 }} required />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>Telefon (opțional)</label>
                <input type="tel" value={manualForm.phoneE164} onChange={e => setManualForm(f => ({ ...f, phoneE164: e.target.value }))} placeholder="07xx xxx xxx" style={s.formInput} />
              </div>
              <div style={{ ...s.formGroup, minWidth: 200 }}>
                <label style={s.formLabel}>Notă (opțional)</label>
                <input value={manualForm.notes} onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} placeholder="ex: scaun înalt, terasă..." style={s.formInput} maxLength={500} />
              </div>
              <button type="submit" disabled={manualSubmitting} style={s.submitBtn}>{manualSubmitting ? "..." : "Adaugă"}</button>
              <button type="button" onClick={() => setShowManualForm(false)} style={s.cancelBtn}>Anulează</button>
            </form>
          </div>
        )}

        {/* Walk-in Popup */}
        {showWalkIn && (
          <div style={s.manualForm}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 10 }}>🚶 Walk-in — Selectează numărul de persoane:</div>
            <div style={{ marginBottom: 10 }}>
              <label style={s.formLabel}>Notă (opțional)</label>
              <input
                value={walkInNotes}
                onChange={e => setWalkInNotes(e.target.value)}
                placeholder="ex: terasă, aniversare..."
                style={{ ...s.formInput, width: "100%", maxWidth: 320, marginTop: 4 }}
                maxLength={500}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={() => handleWalkIn(n)} style={{ padding: "10px 16px", background: "#3730a3", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setShowWalkIn(false)} style={s.cancelBtn}>✕</button>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {showQR && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center"
          }} onClick={() => setShowQR(false)}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: 32, textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 380, width: "90%"
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "#1a1a1a" }}>
                📱 QR Cod Intrare
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                {`${typeof window !== "undefined" ? window.location.origin : ""}/r/${restaurantSlug}`}
              </div>
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" style={{ width: 260, height: 260, borderRadius: 12, border: "2px solid #e5e7eb" }} />
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
                <button onClick={downloadQR} style={{
                  padding: "10px 24px", background: "#16a34a", color: "#fff",
                  border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14
                }}>
                  ⬇️ Descarcă PNG
                </button>
                <button onClick={() => setShowQR(false)} style={{
                  padding: "10px 24px", background: "transparent", color: "#6b7280",
                  border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "pointer", fontSize: 14
                }}>
                  Închide
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Queue */}
        {loading ? (
          <p style={s.muted}>Se încarcă coada...</p>
        ) : activeEntries.length === 0 && recentEntries.length === 0 ? (
          <div style={s.emptyState}><div style={{ fontSize: 48 }}>🎉</div><p>Coada este goală</p></div>
        ) : (
          <>
            {activeEntries.length > 0 && (
              <div style={s.tableWrap}>
                {activeEntries.map((entry, i) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    index={i}
                    editingId={editingId}
                    editForm={editForm}
                    editSubmitting={editSubmitting}
                    onAction={handleAction}
                    onUndo={handleUndo}
                    onStartEdit={startEdit}
                    onEditChange={setEditForm}
                    onEditSave={handleEditSave}
                    onEditCancel={() => setEditingId(null)}
                  />
                ))}
              </div>
            )}

            {/* Recent Undo Section */}
            {recentEntries.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  ↩️ Acțiuni recente (undo disponibil)
                </div>
                <div style={{ ...s.tableWrap, opacity: 0.85 }}>
                  {recentEntries.map((entry, i) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      index={i}
                      editingId={editingId}
                      editForm={editForm}
                      editSubmitting={editSubmitting}
                      onAction={handleAction}
                      onUndo={handleUndo}
                      onStartEdit={startEdit}
                      onEditChange={setEditForm}
                      onEditSave={handleEditSave}
                      onEditCancel={() => setEditingId(null)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <p style={s.refresh}>
          {sseConnected ? "🟢 Live updates active" : "🔴 Reconnecting... (polling la 15s)"}
        </p>
      </div>
    </div>
  );
}

type EntryRowProps = {
  entry: Entry;
  index: number;
  editingId: string | null;
  editForm: { guestName: string; partySize: number; phoneE164: string };
  editSubmitting: boolean;
  onAction: (id: string, action: string) => void;
  onUndo: (id: string, action: "undo-seated" | "undo-skipped" | "re-call") => void;
  onStartEdit: (entry: Entry) => void;
  onEditChange: (form: { guestName: string; partySize: number; phoneE164: string }) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
};

function EntryRow({ entry, index, editingId, editForm, editSubmitting, onAction, onUndo, onStartEdit, onEditChange, onEditSave, onEditCancel }: EntryRowProps) {
  const isLongWait = entry.status === "WAITING" && Date.now() - new Date(entry.createdAt).getTime() > 30 * 60 * 1000;
  return (
    <div
      style={{
        borderLeft: isLongWait ? "4px solid #fb923c" : rowBorder(entry.status),
        background: isLongWait ? "#fff7ed" : rowBg(entry.status),
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap" as const,
      }}
    >
      {/* Position */}
      <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 700, minWidth: 24 }}>#{index + 1}</span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
          {entry.guestName ?? "—"} · {entry.partySize} pers.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, background: "#f3f4f6", padding: "1px 5px", borderRadius: 4 }}>
            {entry.phoneE164}
          </span>
          <WaitingTime createdAt={entry.createdAt} />
        </div>
        {entry.notes && (
          <div style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic", marginTop: 3 }}>
            📝 {entry.notes}
          </div>
        )}
      </div>

      {/* Status + Countdown */}
      <div style={{ minWidth: 130, textAlign: "center" as const }}>
        {entry.status === "NO_SHOW_CONFIRM" && (
          <>
            <span style={{ ...s.badge, background: "#fee2e2", color: "#991b1b" }}>⌛ Confirmation Timeout</span>
            {entry.expiredAt && <div style={{ marginTop: 3 }}><BufferTimer expiredAt={entry.expiredAt} /></div>}
          </>
        )}
        {entry.status === "NO_SHOW_ARRIVAL" && (
          <>
            <span style={{ ...s.badge, background: "#ffedd5", color: "#9a3412" }}>⌛ Time to Seat Expired</span>
            {entry.expiredAt && <div style={{ marginTop: 3 }}><BufferTimer expiredAt={entry.expiredAt} /></div>}
          </>
        )}
        {entry.status === "CALLED" && (
          <>
            <span style={{ ...s.badge, background: "#fed7aa", color: "#9a3412" }}>📲 CALLED</span>
            {entry.confirmDeadlineAt && (
              <div style={{ marginTop: 4 }}>
                <CountdownTimer deadline={entry.confirmDeadlineAt} totalSec={120} />
              </div>
            )}
          </>
        )}
        {entry.status === "CONFIRMED" && (
          <>
            <span style={{ ...s.badge, background: "#bbf7d0", color: "#166534" }}>✅ CONFIRMED</span>
            {entry.arrivalDeadlineAt && (
              <div style={{ marginTop: 4 }}>
                <CountdownTimer deadline={entry.arrivalDeadlineAt} totalSec={300} />
              </div>
            )}
          </>
        )}
        {entry.status === "WAITING" && (
          <>
            <span style={{ ...s.badge }}>⏳ WAITING</span>
            {isLongWait && (
              <div style={{ marginTop: 4 }}>
                <span style={{ ...s.badge, background: "#fed7aa", color: "#9a3412" }}>🕐 Asteptare lunga</span>
              </div>
            )}
          </>
        )}
        {entry.status === "SEATED" && (
          <span style={{ ...s.badge, background: "#e0f2fe", color: "#0369a1" }}>🪑 SEATED</span>
        )}
        {entry.status === "SKIPPED" && (
          <span style={{ ...s.badge, background: "#f3f4f6", color: "#6b7280" }}>⏭ SKIPPED</span>
        )}
        {!["NO_SHOW_CONFIRM","NO_SHOW_ARRIVAL","CALLED","CONFIRMED","WAITING","SEATED","SKIPPED"].includes(entry.status) && (
          <span style={s.badge}>{entry.status}</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
        {entry.status === "WAITING" && (
          <button onClick={() => onAction(entry.id, "call")} style={{ ...s.actionBtn, background: "#ea580c" }}>
            📲 Cheamă
          </button>
        )}
        {["WAITING", "CALLED", "CONFIRMED"].includes(entry.status) && (
          <>
            <button onClick={() => onAction(entry.id, "seat")} style={{ ...s.actionBtn, background: "#2563eb" }}>Seat</button>
            <button onClick={() => onAction(entry.id, "skip")} style={{ ...s.actionBtn, background: "#9ca3af" }}>Skip</button>
          </>
        )}
        {["NO_SHOW_CONFIRM", "NO_SHOW_ARRIVAL"].includes(entry.status) && (entry.callAgainCount ?? 0) < 1 && (
          <button onClick={() => onAction(entry.id, "call-again")} style={{ ...s.actionBtn, background: "#7c3aed" }}>
            🔄 Call Again
          </button>
        )}
        {/* Undo buttons for SEATED */}
        {entry.status === "SEATED" && (
          <>
            <button onClick={() => onUndo(entry.id, "undo-seated")} style={{ ...s.actionBtn, background: "#0891b2" }}>
              ↩️ Undo Seat
            </button>
            <button onClick={() => onUndo(entry.id, "re-call")} style={{ ...s.actionBtn, background: "#7c3aed" }}>
              📲 Re-call
            </button>
          </>
        )}
        {/* Undo button for SKIPPED */}
        {entry.status === "SKIPPED" && (
          <button onClick={() => onUndo(entry.id, "undo-skipped")} style={{ ...s.actionBtn, background: "#0891b2" }}>
            ↩️ Undo Skip
          </button>
        )}
        {["WAITING", "CALLED", "CONFIRMED", "NO_SHOW_CONFIRM", "NO_SHOW_ARRIVAL"].includes(entry.status) && (
          <button onClick={() => onStartEdit(entry)} style={{ ...s.actionBtn, background: "#6b7280" }}>
            ✏️ Edit
          </button>
        )}
      </div>
      {editingId === entry.id && (
        <div style={{ width: "100%", background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "flex-end", marginTop: 8 }}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>Nume</label>
            <input value={editForm.guestName} onChange={e => onEditChange({ ...editForm, guestName: e.target.value })} style={s.formInput} placeholder="Nume" />
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>Persoane</label>
            <input type="number" min={1} max={20} value={editForm.partySize} onChange={e => onEditChange({ ...editForm, partySize: Number(e.target.value) })} style={{ ...s.formInput, width: 70 }} />
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>Telefon</label>
            <input value={editForm.phoneE164} onChange={e => onEditChange({ ...editForm, phoneE164: e.target.value })} style={s.formInput} placeholder="+40..." />
          </div>
          <button onClick={() => onEditSave(entry.id)} disabled={editSubmitting} style={s.submitBtn}>{editSubmitting ? "..." : "Salvează"}</button>
          <button onClick={onEditCancel} style={s.cancelBtn}>Anulează</button>
        </div>
      )}
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
  statusBtn: { padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", transition: "all 0.2s", flex: 1, minWidth: "100px" },
  statsRow: { display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" as const },
  statBox: { flex: 1, minWidth: "80px", borderRadius: "12px", padding: "10px 12px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4 },
  statNum: { fontSize: "28px", fontWeight: 800, lineHeight: 1 },
  statLbl: { fontSize: "11px", fontWeight: 600 },
  msgBox: { border: "1.5px solid", borderRadius: "10px", padding: "10px 16px", marginBottom: "12px", fontSize: "14px", fontWeight: 600 },
  callBtn: { padding: "16px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(22,163,74,0.25)" },
  toolBtn: { padding: "14px 16px", background: "#fff", border: "2px solid #e5e7eb", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#374151" },
  manualForm: { background: "rgba(255,255,255,0.95)", borderRadius: "12px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  formGroup: { display: "flex", flexDirection: "column" as const, gap: 4 },
  formLabel: { fontSize: "12px", fontWeight: 600, color: "#6b7280" },
  formInput: { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none" },
  submitBtn: { padding: "8px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "14px" },
  cancelBtn: { padding: "8px 14px", background: "transparent", color: "#9ca3af", border: "1.5px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  emptyState: { textAlign: "center" as const, padding: "48px 0", color: "#9ca3af", fontSize: "16px" },
  tableWrap: { background: "rgba(255,255,255,0.95)", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" },
  badge: { fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(0,0,0,0.06)" },
  actionBtn: { padding: "5px 12px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#fff" },
  muted: { color: "#9ca3af", padding: "32px 0", textAlign: "center" as const },
  refresh: { fontSize: "11px", color: "#d1d5db", textAlign: "center" as const, marginTop: "24px" },
};
