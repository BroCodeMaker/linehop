"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { useTranslation } from "@/hooks/useTranslation";

interface AuditLog {
  id: string;
  restaurantId: string;
  entryId: string | null;
  action: string;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  CALLED:           { emoji: "📲", label: "Called",              color: "#f97316" },
  SEATED:           { emoji: "✅", label: "Seated",              color: "#10b981" },
  SKIPPED:          { emoji: "⏭️", label: "Skipped",             color: "#9ca3af" },
  NO_SHOW:          { emoji: "❌", label: "No-show",             color: "#ef4444" },
  NO_SHOW_CONFIRM:  { emoji: "⏱️", label: "No-show (confirm)",   color: "#ef4444" },
  NO_SHOW_ARRIVAL:  { emoji: "⏱️", label: "No-show (arrival)",   color: "#dc2626" },
  CANCELLED:        { emoji: "🚫", label: "Cancelled",           color: "#9ca3af" },
  STATUS_CHANGED:   { emoji: "🔄", label: "Status changed",      color: "#3b82f6" },
  ADDED:            { emoji: "➕", label: "Added",               color: "#8b5cf6" },
  CALL_AGAIN:       { emoji: "🔁", label: "Call again",          color: "#f59e0b" },
  UNDO:             { emoji: "↩️", label: "Undo",                color: "#6b7280" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function HistoryPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  const { t } = useTranslation();

  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/audit/${restaurantId}?date=${date}&limit=200`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data.ok) setLogs(data.logs ?? []);
      else setLogs([]);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, date]);

  useEffect(() => { load(); }, [load]);

  // KPI calculations
  const totalActions = logs.length;
  const seatedCount = logs.filter(l => l.action === "SEATED").length;
  const noShowCount = logs.filter(l => l.action === "NO_SHOW" || l.action === "NO_SHOW_CONFIRM" || l.action === "NO_SHOW_ARRIVAL").length;

  // CSV export
  function exportCSV() {
    const rows = [
      ["Time", "Action", "Guest", "Party Size", "Actor", "Details"],
      ...logs.map(l => {
        const meta = l.metadata ?? {};
        const guestName = (meta.guestName as string) ?? "";
        const partySize = (meta.partySize as number) ?? "";
        const details = l.action === "STATUS_CHANGED"
          ? `${meta.from} → ${meta.to}`
          : "";
        return [
          formatTime(l.createdAt),
          l.action,
          guestName,
          String(partySize),
          l.actorEmail ?? "",
          details,
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${restaurantId}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f4", fontFamily: "system-ui, sans-serif" }}>
      <AdminNav restaurantId={restaurantId} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>
              📋 {t("history_title")}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 13 }}>
              {totalActions} actions on {date}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Quick date buttons */}
            <button
              onClick={() => setDate(today)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid " + (date === today ? "#f97316" : "#e5e7eb"), fontSize: 13, background: date === today ? "#fff7ed" : "#fff", color: date === today ? "#f97316" : "#374151", cursor: "pointer", fontWeight: date === today ? 700 : 400 }}
            >
              Today
            </button>
            <button
              onClick={() => setDate(yesterday)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid " + (date === yesterday ? "#f97316" : "#e5e7eb"), fontSize: 13, background: date === yesterday ? "#fff7ed" : "#fff", color: date === yesterday ? "#f97316" : "#374151", cursor: "pointer", fontWeight: date === yesterday ? 700 : 400 }}
            >
              Yesterday
            </button>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, background: "#fff", cursor: "pointer" }}
            />
            <button
              onClick={exportCSV}
              disabled={logs.length === 0}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, background: "#fff", color: "#374151", cursor: logs.length === 0 ? "not-allowed" : "pointer", opacity: logs.length === 0 ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}
            >
              ⬇️ Export CSV
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <KpiCard label="Total actions" value={totalActions} color="#3b82f6" emoji="📊" />
          <KpiCard label="Seated" value={seatedCount} color="#10b981" emoji="✅" />
          <KpiCard label="No-shows" value={noShowCount} color="#ef4444" emoji="❌" />
        </div>

        {/* Audit Log Table */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0e8dc", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No actions recorded for this day.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f0e8dc" }}>
                  {["Time", "Action", "Guest", "Party", "Details"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const cfg = ACTION_CONFIG[log.action] ?? { emoji: "•", label: log.action, color: "#9ca3af" };
                  const meta = log.metadata ?? {};
                  const guestName = (meta.guestName as string) ?? "—";
                  const partySize = meta.partySize != null ? `👥 ${meta.partySize}` : "—";
                  let details = "";
                  if (log.action === "STATUS_CHANGED") details = `${meta.from} → ${meta.to}`;
                  else if (log.action === "NO_SHOW_CONFIRM") details = `Confirmed → no show timeout expired`;
                  else if (log.action === "NO_SHOW_ARRIVAL") details = `Confirmed → no show timeout expired`;
                  else if (meta.walkIn) details = "Walk-in";
                  else if (meta.previousStatus) details = `was ${meta.previousStatus}`;

                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: i < logs.length - 1 ? "1px solid #f9fafb" : "none", background: i % 2 === 0 ? "#fff" : "#fdfcfb" }}
                    >
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                        {formatTime(log.createdAt)}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: cfg.color + "18", color: cfg.color }}>
                          {cfg.emoji} {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                        {guestName}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>
                        {partySize}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#9ca3af" }}>
                        {details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, emoji }: { label: string; value: number; color: string; emoji: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f0e8dc", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
