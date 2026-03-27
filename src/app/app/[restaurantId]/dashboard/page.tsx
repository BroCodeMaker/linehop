"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import AdminNav from "@/components/AdminNav";
import { APP_VERSION } from "@/lib/version";
import { useTranslation } from "@/hooks/useTranslation";

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
  expiredReason?: string;
  callAgainCount?: number;
};

type ErrorLogEntry = {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  restaurant?: { name: string };
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
  const { t } = useTranslation();
  useEffect(() => {
    const expiry = new Date(expiredAt).getTime() + 30 * 60 * 1000;
    const update = () => setSecs(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiredAt]);
  const m = Math.floor(secs / 60), sc = secs % 60;
  return <span style={{ fontSize: 11, color: "#9ca3af" }}>{t("hidden_in")} {m}:{sc.toString().padStart(2, "0")}</span>;
}

// Shows how long an entry has been in expired state (since deadline passed)
function ExpiredTimer({ since }: { since: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const start = new Date(since).getTime();
    const update = () => setSecs(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [since]);
  const m = Math.floor(secs / 60), sc = secs % 60;
  return (
    <span style={{ fontSize: 11, color: "#ef4444", fontVariantNumeric: "tabular-nums" as const }}>
      expirat de {m}:{sc.toString().padStart(2, "0")}
    </span>
  );
}

function isLocallyExpiredFn(entry: Entry): boolean {
  const now = Date.now();
  if (entry.status === "CALLED" && entry.confirmDeadlineAt) {
    return new Date(entry.confirmDeadlineAt).getTime() < now;
  }
  if (entry.status === "CONFIRMED" && entry.arrivalDeadlineAt) {
    return new Date(entry.arrivalDeadlineAt).getTime() < now;
  }
  return false;
}

// Suppress unused import warning
void timeAgo;

export default function DashboardPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  // null = not yet loaded from DB (prevents highlight flicker on refresh)
  const [restStatus, setRestStatus] = useState<RestStatus | null>(null);
  const [listClosed, setListClosed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [maxCallAgain, setMaxCallAgain] = useState<number>(1);
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
  const [showSupport, setShowSupport] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: "", description: "" });
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [loadingErrorLog, setLoadingErrorLog] = useState(false);
  const [showDeployToast, setShowDeployToast] = useState(false);
  const [seatConfirmEntry, setSeatConfirmEntry] = useState<Entry | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [undoState, setUndoState] = useState<Entry | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const sseRef = useRef<EventSource | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/queue`, { credentials: "include" });
      if (res.status === 401) {
        setSessionExpired(true);
        router.push("/app/login");
        return;
      }
      const data = await res.json();
      if (data.ok) setEntries(data.entries);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, router]);

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
      const res = await fetch(`/api/restaurants/${restaurantId}/stats`, { credentials: "include" });
      if (res.status === 401) {
        setSessionExpired(true);
        router.push("/app/login");
        return;
      }
      if (res.ok) {
        const d = await res.json();
        setStats(d);
      }
    } catch { /* ignore */ }
  }, [restaurantId, router]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/settings`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        if (d.ok && d.settings?.maxCallAgain != null) {
          setMaxCallAgain(d.settings.maxCallAgain);
        }
      }
    } catch { /* ignore */ }
  }, [restaurantId]);

  const refreshAll = useCallback(() => {
    fetchQueue();
    fetchRestStatus();
    fetchStats();
  }, [fetchQueue, fetchRestStatus, fetchStats]);

  // SSE setup
  // Deploy toast — show once per version
  useEffect(() => {
    const seenKey = `linehop_deploy_seen_${APP_VERSION}`;
    if (!localStorage.getItem(seenKey)) {
      setShowDeployToast(true);
      localStorage.setItem(seenKey, "1");
      setTimeout(() => setShowDeployToast(false), 6000);
    }
  }, []);

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
    fetchSettings();
  }, [refreshAll, fetchSettings]);

  // Detect mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); };
  }, []);

  function logAudit(action: string, entryId?: string, metadata?: Record<string, unknown>) {
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, entryId, action, metadata }),
    }).catch(() => {});
  }

  async function handleSetStatus(newStatus: RestStatus) {
    if (newStatus === restStatus) return;
    if (newStatus === "CLOSED" && !confirm(t("close_restaurant_confirm"))) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      if (res.ok) {
        logAudit("STATUS_CHANGED", undefined, { from: restStatus, to: newStatus });
        setRestStatus(newStatus);
        await refreshAll();
        const msgs: Record<string, string> = {
          CLOSED: t("msg_status_closed"),
          FULL: t("msg_status_full"),
          OPEN: t("msg_status_open"),
          PAUSED: t("msg_status_paused"),
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
      const res = await fetch(`/api/restaurants/${restaurantId}/toggle-list`, { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setListClosed(data.listClosed);
        setMessage({
          text: data.listClosed ? t("msg_list_closed") : t("msg_list_opened"),
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
      const res = await fetch(`/api/restaurants/${restaurantId}/call-next`, { method: "POST", credentials: "include" });
      if (res.status === 401) { setSessionExpired(true); router.push("/app/login"); return; }
      const data = await res.json();
      if (data.ok && data.entry) {
        logAudit("CALLED", data.entry.id, { guestName: data.entry.guestName, partySize: data.entry.partySize });
        setMessage({ text: t("msg_called").replace("{name}", data.entry.guestName ?? data.entry.phoneE164).replace("{size}", String(data.entry.partySize)), type: "ok" });
      } else {
        setMessage({ text: t("msg_no_waiting"), type: "info" });
      }
      await refreshAll();
    } finally {
      setCallingNext(false);
    }
  }

  async function handleAction(entryId: string, action: string) {
    const prevEntry = entries.find(e => e.id === entryId);
    const res = await fetch(`/api/restaurants/${restaurantId}/entries/${entryId}/${action}`, { method: "POST", credentials: "include" });
    if (!res.ok) {
      if (res.status === 401) {
        setSessionExpired(true);
        router.push("/app/login");
        return;
      }
      const d = await res.json().catch(() => ({}));
      setMessage({ text: `❌ ${d.error ?? t("error")}`, type: "info" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      const auditActionMap: Record<string, string> = {
        seat: "SEATED",
        skip: "SKIPPED",
        cancel: "CANCELLED",
        "call-again": "CALL_AGAIN",
        call: "CALLED",
      };
      const auditAction = auditActionMap[action];
      if (auditAction && prevEntry) {
        logAudit(auditAction, entryId, { guestName: prevEntry.guestName, partySize: prevEntry.partySize });
      }
      if (prevEntry) {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setUndoState(prevEntry);
        undoTimerRef.current = setTimeout(() => setUndoState(null), 10000);
      }
    }
    await refreshAll();
  }

  async function handleGeneralUndo() {
    if (!undoState) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const entryToRestore = undoState;
    setUndoState(null);
    await fetch(`/api/restaurants/${restaurantId}/entries/${entryToRestore.id}/undo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        previousStatus: entryToRestore.status,
        previousData: {
          calledAt: entryToRestore.calledAt ?? null,
          confirmedAt: entryToRestore.confirmedAt ?? null,
          seatedAt: entryToRestore.seatedAt ?? null,
          skippedAt: entryToRestore.skippedAt ?? null,
          expiredAt: entryToRestore.expiredAt ?? null,
          expiredReason: entryToRestore.expiredReason ?? null,
          confirmDeadlineAt: entryToRestore.confirmDeadlineAt ?? null,
          arrivalDeadlineAt: entryToRestore.arrivalDeadlineAt ?? null,
          callAgainCount: entryToRestore.callAgainCount ?? 0,
        },
      }),
    });
    logAudit("UNDO", entryToRestore.id, { guestName: entryToRestore.guestName, previousStatus: entryToRestore.status });
    await refreshAll();
    setMessage({ text: t("msg_undo"), type: "ok" });
    setTimeout(() => setMessage(null), 2000);
  }

  function handleSeatClick(entry: Entry) {
    if (entry.status === "WAITING") {
      setSeatConfirmEntry(entry);
    } else {
      handleAction(entry.id, "seat");
    }
  }

  async function handleUndo(entryId: string, action: "undo-seated" | "undo-skipped" | "re-call") {
    const res = await fetch(`/api/restaurants/${restaurantId}/entries/${entryId}/${action}`, { method: "POST", credentials: "include" });
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

  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSupportSubmitting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/error-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
        credentials: "include",
      });
      if (res.ok) {
        setShowSupport(false);
        setSupportForm({ subject: "", description: "" });
        setMessage({ text: t("msg_support_sent"), type: "ok" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const d = await res.json().catch(() => ({}));
        setMessage({ text: `❌ ${d.error ?? "Eroare"}`, type: "info" });
      }
    } finally {
      setSupportSubmitting(false);
    }
  }

  async function openErrorLog() {
    setShowErrorLog(true);
    setLoadingErrorLog(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/error-log`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setErrorLogs(data.logs ?? []);
      }
    } finally {
      setLoadingErrorLog(false);
    }
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
        credentials: "include",
        body: JSON.stringify({
          guestName: manualForm.guestName,
          partySize: manualForm.partySize,
          phoneE164: manualForm.phoneE164 || undefined,
          notes: manualForm.notes || undefined,
        }),
      });
      if (res.ok) {
        const addData = await res.json().catch(() => ({}));
        logAudit("ADDED", addData.entry?.id, { guestName: manualForm.guestName, partySize: manualForm.partySize });
        setShowManualForm(false);
        setManualForm({ guestName: "", partySize: 2, phoneE164: "", notes: "" });
        await refreshAll();
        setMessage({ text: t("msg_group_added"), type: "ok" });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setManualSubmitting(false);
    }
  }

  async function handleWalkIn(partySize: number) {
    setShowWalkIn(false);
    const wiRes = await fetch(`/api/restaurants/${restaurantId}/entries/walk-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ partySize, notes: walkInNotes || undefined }),
    });
    if (wiRes.ok) {
      const wiData = await wiRes.json().catch(() => ({}));
      logAudit("SEATED", wiData.entry?.id, { guestName: "Walk-in", partySize, walkIn: true });
    }
    setWalkInNotes("");
    await refreshAll();
    setMessage({ text: t("msg_walk_in_registered").replace("{size}", String(partySize)), type: "ok" });
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
      setMessage({ text: t("msg_qr_error"), type: "info" });
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
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        await refreshAll();
        setMessage({ text: t("msg_entry_updated"), type: "ok" });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setEditSubmitting(false);
    }
  }

  const waiting = entries.filter(e => e.status === "WAITING").length;
  const called = entries.filter(e => e.status === "CALLED").length;
  const confirmed = entries.filter(e => e.status === "CONFIRMED").length;

  // Split entries into active queue, expired/no-show, and recent undo-able
  const activeEntries = entries.filter(e => {
    if (["SEATED", "SKIPPED", "NO_SHOW_CONFIRM", "NO_SHOW_ARRIVAL"].includes(e.status)) return false;
    if (isLocallyExpiredFn(e)) return false;
    return true;
  });
  const expiredEntries = entries.filter(e => {
    if (!["NO_SHOW_CONFIRM", "NO_SHOW_ARRIVAL"].includes(e.status) && !isLocallyExpiredFn(e)) return false;
    // Auto-hide NO_SHOW entries after 30 minutes (client-side filter, no DB delete)
    if (["NO_SHOW_CONFIRM", "NO_SHOW_ARRIVAL"].includes(e.status)) {
      const refTime = e.expiredAt || e.createdAt;
      const minutesSince = (Date.now() - new Date(refTime).getTime()) / 60000;
      if (minutesSince > 30) return false;
    }
    return true;
  });
  const UNDO_WINDOW_MS = 5 * 60 * 1000; // 5 minute
  const recentEntries = entries.filter(e => {
    if (!["SEATED", "SKIPPED"].includes(e.status)) return false;
    const actionTime = e.seatedAt || e.skippedAt;
    if (!actionTime) return false;
    return Date.now() - new Date(actionTime).getTime() < UNDO_WINDOW_MS;
  });

  const statusCfg: Record<string, { label: string; active: string; icon: string }> = {
    OPEN:   { label: t("restStatus_OPEN"),   active: "#16a34a", icon: "🟢" },
    FULL:   { label: t("restStatus_FULL"),   active: "#ea580c", icon: "🔴" },
    PAUSED: { label: t("restStatus_PAUSED"), active: "#d97706", icon: "⏸️" },
    CLOSED: { label: t("restStatus_CLOSED"), active: "#6b7280", icon: "🌙" },
  };

  // Suppress unused warning
  void handleLogout;

  // Auto-expire CALLED entries (confirmDeadlineAt passed) and CONFIRMED entries (arrivalDeadlineAt passed)
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();

      const expiredCalled = entries.filter(
        (e) =>
          e.status === "CALLED" &&
          e.confirmDeadlineAt &&
          new Date(e.confirmDeadlineAt).getTime() < now
      );

      const expiredConfirmed = entries.filter(
        (e) =>
          e.status === "CONFIRMED" &&
          e.arrivalDeadlineAt &&
          new Date(e.arrivalDeadlineAt).getTime() < now
      );

      const toExpire = [...expiredCalled, ...expiredConfirmed];

      for (const entry of toExpire) {
        await fetch(
          `/api/restaurants/${restaurantId}/entries/${entry.id}/no-show`,
          { method: "POST", credentials: "include" }
        ).catch(() => {});
      }
      if (toExpire.length > 0) {
        fetchQueue();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [entries, restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: FOOD_BG, fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Nav */}
      <AdminNav
        restaurantId={restaurantId}
        onSupport={() => setShowSupport(true)}
        onErrorLog={openErrorLog}
      />

      {/* Session expired banner */}
      {sessionExpired && (
        <div style={{ background: "#ef4444", color: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Sesiunea a expirat. Reconectează-te.</span>
          <a href="/app/login" style={{ background: "#fff", color: "#ef4444", fontWeight: 700, fontSize: 13, padding: "4px 12px", borderRadius: 6, textDecoration: "none" }}>Login →</a>
        </div>
      )}

      {/* Live status indicator */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f3f4f6", padding: "6px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: sseConnected ? "#16a34a" : "#ef4444" }}>
          {sseConnected ? t("live_active") : t("live_reconnecting")}
        </span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{t("queue_dashboard")}</span>
        <span style={{ fontSize: 11, color: "#d1d5db", marginLeft: "auto" }}>v{APP_VERSION}</span>
      </div>

      <div style={s.body}>
        {/* Restaurant Status Toggle */}
        <div style={s.statusCard}>
          <div style={s.statusLabel}>{t("rest_status_label")}</div>
          <div style={s.statusRow}>
            {(["OPEN", "FULL", "PAUSED", "CLOSED"] as RestStatus[]).map((st) => {
              const c = statusCfg[st];
              const isActive = restStatus === st;
              return (
                <button
                  key={st}
                  onPointerUp={() => handleSetStatus(st)}
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
              {listClosed ? t("list_open") : t("list_close")}
            </button>
            {listClosed && (
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {t("list_closed_note")}
              </span>
            )}
          </div>
        </div>

        {/* Stats Bar (live metrics) */}
        <div style={s.statsRow}>
          <div style={{ ...s.statBox, background: "#fef3c7", color: "#92400e" }}>
            <span style={s.statLbl}>{t("waiting_now")}</span>
            <span style={s.statNum}>{stats?.waitingNow ?? waiting}</span>
          </div>
          <div style={{ ...s.statBox, background: "#fed7aa", color: "#9a3412" }}>
            <span style={s.statLbl}>{t("avg_turnover")}</span>
            <span style={s.statNum}>
              {stats?.avgWaitMinutes != null ? `${stats.avgWaitMinutes}m` : "—"}
            </span>
          </div>
          <div style={{ ...s.statBox, background: "#dcfce7", color: "#166534" }}>
            <span style={s.statLbl}>{t("seated_tonight")}</span>
            <span style={s.statNum}>{stats?.seatedTonight ?? 0}</span>
          </div>
          <div style={{ ...s.statBox, background: "#ede9fe", color: "#5b21b6" }}>
            <span style={s.statLbl}>{t("confirm_rate")}</span>
            <span style={s.statNum}>
              {stats?.confirmRate != null ? `${stats.confirmRate}%` : "—"}
            </span>
          </div>
          <div style={{ ...s.statBox, background: "#fed7aa", color: "#9a3412" }}>
            <span style={s.statLbl}>{t("called_stat")}</span>
            <span style={s.statNum}>{called}</span>
          </div>
          <div style={{ ...s.statBox, background: "#dcfce7", color: "#166534" }}>
            <span style={s.statLbl}>{t("confirmed_stat")}</span>
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
        <div style={{ marginBottom: 16 }}>
          {/* CALL NEXT — dominant button */}
          <button
            onClick={handleCallNext}
            disabled={callingNext || waiting === 0 || restStatus === "CLOSED"}
            style={{ ...s.callBtn, width: "100%", marginBottom: 10, opacity: (waiting === 0 || restStatus === "CLOSED") ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <span style={{ fontSize: 22 }}>📲</span>
            {callingNext ? t("calling") : t("call_next")}
          </button>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <button onClick={() => setShowManualForm(v => !v)} style={{ ...s.toolBtn, flex: 1, minWidth: 130 }}>
            {t("add_manual")}
          </button>
          <button onClick={() => setShowWalkIn(v => !v)} style={{ ...s.toolBtn, flex: 1, minWidth: 110, background: "#e0e7ff", color: "#3730a3", border: "2px solid #a5b4fc" }}>
            {t("walk_in")}
          </button>
          <button onClick={openQR} style={{ ...s.toolBtn, flex: 1, minWidth: 110, background: "#f0fdf4", color: "#166534", border: "2px solid #86efac" }}>
            {t("qr_code")}
          </button>
          <button onClick={async () => {
            if (!confirm(t("reset_confirm"))) return;
            await fetch(`/api/restaurants/${restaurantId}/reset-test`, { method: "POST", credentials: "include" });
            fetchQueue();
          }} style={{ ...s.toolBtn, flex: 1, minWidth: 110, background: "#fff1f2", color: "#be123c", border: "2px solid #fda4af" }}>
            {t("reset_test")}
          </button>
          </div>
        </div>

        {/* Manual Add Form */}
        {showManualForm && (
          <div style={s.manualForm}>
            <form onSubmit={handleManualAdd} style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "flex-end" }}>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{t("field_name_required")}</label>
                <input value={manualForm.guestName} onChange={e => setManualForm(f => ({ ...f, guestName: e.target.value }))} placeholder={t("name_placeholder")} required style={s.formInput} />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{t("field_persons_required")}</label>
                <input type="number" min={1} max={20} value={manualForm.partySize} onChange={e => setManualForm(f => ({ ...f, partySize: Number(e.target.value) }))} style={{ ...s.formInput, width: 70 }} required />
              </div>
              <div style={s.formGroup}>
                <label style={s.formLabel}>{t("field_phone_optional")}</label>
                <input type="tel" value={manualForm.phoneE164} onChange={e => setManualForm(f => ({ ...f, phoneE164: e.target.value }))} placeholder={t("phone_placeholder")} style={s.formInput} />
              </div>
              <div style={{ ...s.formGroup, minWidth: 200 }}>
                <label style={s.formLabel}>{t("field_note")}</label>
                <input value={manualForm.notes} onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} placeholder={t("note_placeholder")} style={s.formInput} maxLength={500} />
              </div>
              <button type="submit" disabled={manualSubmitting} style={s.submitBtn}>{manualSubmitting ? "..." : t("add")}</button>
              <button type="button" onClick={() => setShowManualForm(false)} style={s.cancelBtn}>{t("cancel")}</button>
            </form>
          </div>
        )}

        {/* Walk-in Popup */}
        {showWalkIn && (
          <div style={s.manualForm}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 10 }}>{t("walk_in_title")}</div>
            <div style={{ marginBottom: 10 }}>
              <label style={s.formLabel}>{t("field_note")}</label>
              <input
                value={walkInNotes}
                onChange={e => setWalkInNotes(e.target.value)}
                placeholder={t("walk_in_note_placeholder")}
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
                {t("qr_title")}
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
                  {t("qr_download")}
                </button>
                <button onClick={() => setShowQR(false)} style={{
                  padding: "10px 24px", background: "transparent", color: "#6b7280",
                  border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "pointer", fontSize: 14
                }}>
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Support Modal */}
        {showSupport && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center"
          }} onClick={() => setShowSupport(false)}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: 32,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 460, width: "90%"
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: "#1a1a1a" }}>{t("support_title")}</div>
              <form onSubmit={handleSupportSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>{t("support_subject")}</label>
                  <input
                    value={supportForm.subject}
                    onChange={e => setSupportForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder={t("support_subject_placeholder")}
                    required
                    style={s.formInput}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.formLabel}>{t("support_description")}</label>
                  <textarea
                    value={supportForm.description}
                    onChange={e => setSupportForm(f => ({ ...f, description: e.target.value }))}
                    placeholder={t("support_description_placeholder")}
                    required
                    rows={4}
                    style={{ ...s.formInput, resize: "vertical" as const, fontFamily: "inherit" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setShowSupport(false)} style={s.cancelBtn}>{t("cancel")}</button>
                  <button type="submit" disabled={supportSubmitting} style={s.submitBtn}>
                    {supportSubmitting ? t("support_sending") : t("support_send")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Error Log Modal */}
        {showErrorLog && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center"
          }} onClick={() => setShowErrorLog(false)}>
            <div style={{
              background: "#fff", padding: 32,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflowY: "auto" as const,
              ...(isMobile
                ? { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: 0 }
                : { borderRadius: 20, maxWidth: 700, width: "95%", maxHeight: "80vh" }),
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: "#1a1a1a" }}>{t("error_log_title")}</div>
              {loadingErrorLog ? (
                <p style={s.muted}>{t("loading")}</p>
              ) : errorLogs.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center" as const, padding: "24px 0" }}>{t("error_log_empty")}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {errorLogs.map(log => (
                    <div key={log.id} style={{
                      background: log.status === "open" ? "#fef3c7" : "#f9fafb",
                      border: `1.5px solid ${log.status === "open" ? "#fcd34d" : "#e5e7eb"}`,
                      borderRadius: 10, padding: "12px 16px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{log.subject}</div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                          background: log.status === "open" ? "#fcd34d" : "#e5e7eb",
                          color: log.status === "open" ? "#92400e" : "#6b7280",
                          whiteSpace: "nowrap" as const
                        }}>
                          {log.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>{log.description}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                        {new Date(log.createdAt).toLocaleString("ro-RO")}
                        {log.restaurant && <> · {log.restaurant.name}</>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 20, textAlign: "right" as const }}>
                <button onClick={() => setShowErrorLog(false)} style={s.cancelBtn}>{t("close")}</button>
              </div>
            </div>
          </div>
        )}

        {/* Seat Without Call Confirmation Modal */}
        {seatConfirmEntry && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center"
          }} onClick={() => setSeatConfirmEntry(null)}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: 32,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 400, width: "90%"
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 32, textAlign: "center" as const, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", textAlign: "center" as const, marginBottom: 8 }}>
                {t("seat_without_call_title")}
              </div>
              <div style={{ fontSize: 14, color: "#6b7280", textAlign: "center" as const, marginBottom: 24 }}>
                {t("seat_without_call_body").replace("{name}", seatConfirmEntry.guestName ?? seatConfirmEntry.phoneE164).replace("{size}", String(seatConfirmEntry.partySize))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  onClick={() => setSeatConfirmEntry(null)}
                  style={{ padding: "10px 24px", background: "transparent", color: "#6b7280", border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() => { const e = seatConfirmEntry; setSeatConfirmEntry(null); handleAction(e.id, "seat"); }}
                  style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700 }}
                >
                  {t("confirm_seated")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Toast */}
        {undoState && (
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: "#1f2937", color: "#fff", borderRadius: 12,
            padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
            zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", fontSize: 14, fontWeight: 600,
            whiteSpace: "nowrap" as const,
          }}>
            <span>{t("action_done")}</span>
            <button
              onClick={handleGeneralUndo}
              style={{ padding: "6px 14px", background: "#fb923c", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
            >
              {t("undo")}
            </button>
          </div>
        )}

        {/* Active Queue */}
        {loading ? (
          <p style={s.muted}>{t("loading")}</p>
        ) : activeEntries.length === 0 && expiredEntries.length === 0 && recentEntries.length === 0 ? (
          <div style={s.emptyState}><div style={{ fontSize: 48 }}>🎉</div><p>{t("queue_empty")}</p></div>
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
                    maxCallAgain={maxCallAgain}
                    onAction={handleAction}
                    onSeat={handleSeatClick}
                    onUndo={handleUndo}
                    onStartEdit={startEdit}
                    onEditChange={setEditForm}
                    onEditSave={handleEditSave}
                    onEditCancel={() => setEditingId(null)}
                  />
                ))}
              </div>
            )}

            {/* Expired / No-show Section */}
            {expiredEntries.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                    {t("expired_section").replace("{count}", String(expiredEntries.length))}
                  </span>
                </div>
                <div style={s.tableWrap}>
                  {expiredEntries.map((entry, i) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      index={i}
                      editingId={editingId}
                      editForm={editForm}
                      editSubmitting={editSubmitting}
                      maxCallAgain={maxCallAgain}
                      onAction={handleAction}
                      onSeat={handleSeatClick}
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

            {/* Recent Undo Section */}
            {recentEntries.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  {t("recent_section")}
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
                      maxCallAgain={maxCallAgain}
                      onAction={handleAction}
                      onSeat={handleSeatClick}
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
          {sseConnected ? t("live_updates_active") : t("reconnecting_polling")}
        </p>

        <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#9ca3af", borderTop: "1px solid #f3f4f6", marginTop: "auto" }}>
          LineHop™ 2026
        </div>
      </div>

      {/* Deploy Toast */}
      {showDeployToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "#16a34a", color: "#fff",
          padding: "12px 20px", borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(22,163,74,0.4)",
          fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 10,
          animation: "slideIn 0.3s ease"
        }}>
          <span>✅ Deploy v{APP_VERSION} live</span>
          <button onClick={() => setShowDeployToast(false)} style={{
            background: "rgba(255,255,255,0.2)", border: "none",
            color: "#fff", borderRadius: "6px", padding: "2px 8px",
            cursor: "pointer", fontSize: 12, fontWeight: 700
          }}>✕</button>
        </div>
      )}
    </div>
  );
}

type EntryRowProps = {
  entry: Entry;
  index: number;
  editingId: string | null;
  editForm: { guestName: string; partySize: number; phoneE164: string };
  editSubmitting: boolean;
  maxCallAgain: number;
  onAction: (id: string, action: string) => void;
  onSeat: (entry: Entry) => void;
  onUndo: (id: string, action: "undo-seated" | "undo-skipped" | "re-call") => void;
  onStartEdit: (entry: Entry) => void;
  onEditChange: (form: { guestName: string; partySize: number; phoneE164: string }) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
};

function EntryRow({ entry, index, editingId, editForm, editSubmitting, maxCallAgain, onAction, onSeat, onUndo, onStartEdit, onEditChange, onEditSave, onEditCancel }: EntryRowProps) {
  const { t } = useTranslation();
  const now = Date.now();
  const isLongWait = entry.status === "WAITING" && now - new Date(entry.createdAt).getTime() > 30 * 60 * 1000;
  const locallyExpired =
    (entry.status === "CALLED" && entry.confirmDeadlineAt && new Date(entry.confirmDeadlineAt).getTime() < now) ||
    (entry.status === "CONFIRMED" && entry.arrivalDeadlineAt && new Date(entry.arrivalDeadlineAt).getTime() < now);
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
            <span style={{ ...s.badge, background: "#fee2e2", color: "#991b1b" }}>⌛ {t("status_NO_SHOW_CONFIRM")}</span>
            {entry.expiredAt && <div style={{ marginTop: 3 }}><BufferTimer expiredAt={entry.expiredAt} /></div>}
          </>
        )}
        {entry.status === "NO_SHOW_ARRIVAL" && (
          <>
            <span style={{ ...s.badge, background: "#ffedd5", color: "#9a3412" }}>⌛ {t("status_NO_SHOW_ARRIVAL")}</span>
            {entry.expiredAt && <div style={{ marginTop: 3 }}><BufferTimer expiredAt={entry.expiredAt} /></div>}
          </>
        )}
        {entry.status === "CALLED" && !locallyExpired && (
          <>
            <span style={{ ...s.badge, background: "#fed7aa", color: "#9a3412" }}>📲 {t("status_CALLED")}</span>
            {entry.confirmDeadlineAt && (
              <div style={{ marginTop: 4 }}>
                <CountdownTimer deadline={entry.confirmDeadlineAt} totalSec={120} />
              </div>
            )}
          </>
        )}
        {entry.status === "CALLED" && locallyExpired && (
          <>
            <span style={{ ...s.badge, background: "#fee2e2", color: "#991b1b" }}>⏰ {t("status_CALLED")} ({t("expired_for")})</span>
            {entry.confirmDeadlineAt && (
              <div style={{ marginTop: 3 }}>
                <ExpiredTimer since={entry.confirmDeadlineAt} />
              </div>
            )}
          </>
        )}
        {entry.status === "CONFIRMED" && !locallyExpired && (
          <>
            <span style={{ ...s.badge, background: "#bbf7d0", color: "#166534" }}>✅ {t("status_CONFIRMED")}</span>
            {entry.arrivalDeadlineAt && (
              <div style={{ marginTop: 4 }}>
                <CountdownTimer deadline={entry.arrivalDeadlineAt} totalSec={300} />
              </div>
            )}
          </>
        )}
        {entry.status === "CONFIRMED" && locallyExpired && (
          <>
            <span style={{ ...s.badge, background: "#ffedd5", color: "#9a3412" }}>⏰ {t("status_CONFIRMED")} ({t("expired_for")})</span>
            {entry.arrivalDeadlineAt && (
              <div style={{ marginTop: 3 }}>
                <ExpiredTimer since={entry.arrivalDeadlineAt} />
              </div>
            )}
          </>
        )}
        {entry.status === "WAITING" && (
          <>
            <span style={{ ...s.badge }}>⏳ {t("status_WAITING")}</span>
            {isLongWait && (
              <div style={{ marginTop: 4 }}>
                <span style={{ ...s.badge, background: "#fed7aa", color: "#9a3412" }}>{t("long_wait")}</span>
              </div>
            )}
          </>
        )}
        {entry.status === "SEATED" && (
          <span style={{ ...s.badge, background: "#e0f2fe", color: "#0369a1" }}>🪑 {t("status_SEATED")}</span>
        )}
        {entry.status === "SKIPPED" && (
          <span style={{ ...s.badge, background: "#f3f4f6", color: "#6b7280" }}>⏭ {t("status_SKIPPED")}</span>
        )}
        {!["NO_SHOW_CONFIRM","NO_SHOW_ARRIVAL","CALLED","CONFIRMED","WAITING","SEATED","SKIPPED"].includes(entry.status) && (
          <span style={s.badge}>{entry.status}</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
        {entry.status === "WAITING" && (
          <button onClick={() => onAction(entry.id, "call")} style={{ ...s.actionBtn, background: "#ea580c" }}>
            {t("call_action")}
          </button>
        )}
        {["WAITING", "CALLED", "CONFIRMED"].includes(entry.status) && (
          <>
            <button onClick={() => onSeat(entry)} style={{ ...s.actionBtn, background: "#2563eb" }}>{t("seat_action")}</button>
            <button onClick={() => onAction(entry.id, "skip")} style={{ ...s.actionBtn, background: "#9ca3af" }}>{t("skip_action")}</button>
          </>
        )}
        {["NO_SHOW_CONFIRM", "NO_SHOW_ARRIVAL"].includes(entry.status) && (entry.callAgainCount ?? 0) < maxCallAgain && (
          <button onClick={() => onAction(entry.id, "call-again")} style={{ ...s.actionBtn, background: "#7c3aed" }}>
            {t("call_again_action")}
          </button>
        )}
        {/* Undo buttons for SEATED */}
        {entry.status === "SEATED" && (
          <>
            <button onClick={() => onUndo(entry.id, "undo-seated")} style={{ ...s.actionBtn, background: "#0891b2" }}>
              {t("undo_seat")}
            </button>
            <button onClick={() => onUndo(entry.id, "re-call")} style={{ ...s.actionBtn, background: "#7c3aed" }}>
              {t("re_call")}
            </button>
          </>
        )}
        {/* Undo button for SKIPPED */}
        {entry.status === "SKIPPED" && (
          <button onClick={() => onUndo(entry.id, "undo-skipped")} style={{ ...s.actionBtn, background: "#0891b2" }}>
            {t("undo_skip")}
          </button>
        )}
        {["WAITING", "CALLED", "CONFIRMED", "NO_SHOW_CONFIRM", "NO_SHOW_ARRIVAL"].includes(entry.status) && (
          <button onClick={() => onStartEdit(entry)} style={{ ...s.actionBtn, background: "#6b7280" }}>
            {t("edit_action")}
          </button>
        )}
      </div>
      {editingId === entry.id && (
        <div style={{ width: "100%", background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "flex-end", marginTop: 8 }}>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{t("field_name")}</label>
            <input value={editForm.guestName} onChange={e => onEditChange({ ...editForm, guestName: e.target.value })} style={s.formInput} placeholder={t("field_name")} />
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{t("field_persons")}</label>
            <input type="number" min={1} max={20} value={editForm.partySize} onChange={e => onEditChange({ ...editForm, partySize: Number(e.target.value) })} style={{ ...s.formInput, width: 70 }} />
          </div>
          <div style={s.formGroup}>
            <label style={s.formLabel}>{t("field_phone")}</label>
            <input value={editForm.phoneE164} onChange={e => onEditChange({ ...editForm, phoneE164: e.target.value })} style={s.formInput} placeholder="+40..." />
          </div>
          <button onClick={() => onEditSave(entry.id)} disabled={editSubmitting} style={s.submitBtn}>{editSubmitting ? "..." : t("save_action")}</button>
          <button onClick={onEditCancel} style={s.cancelBtn}>{t("cancel")}</button>
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
  body: { padding: "20px 16px", maxWidth: 1100, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" },
  statusCard: { background: "rgba(255,255,255,0.97)", borderRadius: "18px", padding: "18px 22px", marginBottom: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6" },
  statusLabel: { fontSize: "11px", fontWeight: 800, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "12px" },
  statusRow: { display: "flex", gap: "10px", flexWrap: "wrap" as const },
  statusBtn: { padding: "13px 22px", borderRadius: "12px", cursor: "pointer", fontSize: "15px", fontWeight: 700, transition: "all 0.18s", flex: 1, minWidth: "110px", letterSpacing: "-0.01em" },
  statsRow: { display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" as const },
  statBox: { flex: 1, minWidth: "90px", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 5, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" },
  statNum: { fontSize: "34px", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em" },
  statLbl: { fontSize: "11px", fontWeight: 700, textAlign: "center" as const },
  msgBox: { border: "1.5px solid", borderRadius: "10px", padding: "10px 16px", marginBottom: "12px", fontSize: "14px", fontWeight: 600 },
  callBtn: { padding: "20px 24px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "18px", fontWeight: 900, cursor: "pointer", boxShadow: "0 6px 22px rgba(22,163,74,0.35)", letterSpacing: "-0.02em", textTransform: "uppercase" as const },
  toolBtn: { padding: "14px 16px", background: "#fff", border: "2px solid #e5e7eb", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#374151" },
  manualForm: { background: "rgba(255,255,255,0.95)", borderRadius: "12px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  formGroup: { display: "flex", flexDirection: "column" as const, gap: 4 },
  formLabel: { fontSize: "12px", fontWeight: 600, color: "#6b7280" },
  formInput: { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none" },
  submitBtn: { padding: "8px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "14px" },
  cancelBtn: { padding: "8px 14px", background: "transparent", color: "#9ca3af", border: "1.5px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  emptyState: { textAlign: "center" as const, padding: "48px 0", color: "#9ca3af", fontSize: "16px" },
  tableWrap: { background: "rgba(255,255,255,0.97)", borderRadius: "16px", boxShadow: "0 2px 14px rgba(0,0,0,0.07)", overflowX: "auto", border: "1px solid #f3f4f6" },
  badge: { fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: "rgba(0,0,0,0.06)", display: "inline-block" },
  actionBtn: { padding: "7px 14px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#fff" },
  muted: { color: "#9ca3af", padding: "32px 0", textAlign: "center" as const },
  refresh: { fontSize: "11px", color: "#d1d5db", textAlign: "center" as const, marginTop: "24px" },
};
