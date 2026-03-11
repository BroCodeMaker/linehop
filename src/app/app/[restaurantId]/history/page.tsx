"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface HistoryEntry {
  id: string;
  guestName: string;
  partySize: number;
  status: string;
  isWalkIn: boolean;
  createdAt: string;
  seatedAt: string | null;
  waitMinutes: number | null;
  cancelAfterMinutes: number | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  WAITING:   { label: "Așteptare", color: "#f59e0b" },
  CALLED:    { label: "Chemat",    color: "#3b82f6" },
  CONFIRMED: { label: "Confirmat", color: "#8b5cf6" },
  SEATED:    { label: "Așezat",    color: "#10b981" },
  CANCELLED: { label: "Anulat",    color: "#ef4444" },
  EXPIRED:   { label: "Expirat",   color: "#9ca3af" },
  SKIPPED:   { label: "Sărit",     color: "#f97316" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function HistoryPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (date) params.set("date", date);
      const res = await fetch(`/api/restaurants/${restaurantId}/history?${params}`);
      const data = await res.json();
      if (data.ok) {
        setEntries(data.entries);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId, page, date]);

  useEffect(() => { load(); }, [load]);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", background: "#faf7f4", fontFamily: "system-ui, sans-serif" }}>
      <AdminNav restaurantId={restaurantId} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>📋 Istoric coadă</h1>
            <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 13 }}>{total} intrări total</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="date"
              value={date}
              max={todayStr}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, background: "#fff", cursor: "pointer" }}
            />
            {date && (
              <button
                onClick={() => { setDate(""); setPage(1); }}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, background: "#fff", cursor: "pointer", color: "#6b7280" }}
              >
                Toate
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0e8dc", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Se încarcă...</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Nicio intrare găsită.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f0e8dc" }}>
                  {["Nume", "Persoane", "Status", "Intrat la", "Așteptat", "Anulat după"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => {
                  const st = STATUS_LABELS[e.status] ?? { label: e.status, color: "#9ca3af" };
                  return (
                    <tr key={e.id} style={{ borderBottom: i < entries.length - 1 ? "1px solid #f9fafb" : "none", background: i % 2 === 0 ? "#fff" : "#fdfcfb" }}>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                        {e.guestName}
                        {e.isWalkIn && <span style={{ marginLeft: 6, fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>(walk-in)</span>}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 14, color: "#374151" }}>👥 {e.partySize}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: st.color + "18", color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                        {formatDate(e.createdAt)} {formatTime(e.createdAt)}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: e.waitMinutes !== null ? "#10b981" : "#d1d5db", fontWeight: e.waitMinutes !== null ? 600 : 400 }}>
                        {e.waitMinutes !== null ? `${e.waitMinutes} min` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: e.cancelAfterMinutes !== null ? "#ef4444" : "#d1d5db", fontWeight: e.cancelAfterMinutes !== null ? 600 : 400 }}>
                        {e.cancelAfterMinutes !== null ? `${e.cancelAfterMinutes} min` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1, background: "#fff" }}>← Prev</button>
            <span style={{ padding: "7px 14px", fontSize: 14, color: "#6b7280" }}>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1, background: "#fff" }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
