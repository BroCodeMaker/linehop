"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Entry = {
  id: string;
  partySize: number;
  phoneE164: string;
  guestName?: string;
  status: string;
  createdAt: string;
  calledAt?: string;
};

const STATUS_COLORS: Record<string, string> = {
  WAITING: "#fef3c7",
  CALLED: "#fed7aa",
  CONFIRMED: "#dcfce7",
  SEATED: "#dbeafe",
  SKIPPED: "#f3f4f6",
  EXPIRED: "#f3f4f6",
};

function timeAgo(date: string) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function DashboardPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchQueue() {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/queue`);
      const data = await res.json();
      if (data.ok) setEntries(data.entries);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function handleCallNext() {
    setCallingNext(true);
    setMessage("");
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/call-next`, { method: "POST" });
      const data = await res.json();
      if (data.ok && data.entry) {
        setMessage(`✅ Called: ${data.entry.guestName ?? data.entry.phoneE164} (party of ${data.entry.partySize})`);
      } else {
        setMessage("ℹ️ No WAITING guests in queue");
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

  const waiting = entries.filter((e) => e.status === "WAITING").length;
  const called = entries.filter((e) => e.status === "CALLED").length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🍽️ Queue Dashboard</h1>
        <div style={styles.stats}>
          <span style={{ ...styles.stat, background: "#fef3c7" }}>⏳ {waiting} waiting</span>
          <span style={{ ...styles.stat, background: "#fed7aa" }}>📲 {called} called</span>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <button
        onClick={handleCallNext}
        disabled={callingNext || waiting === 0}
        style={{ ...styles.callBtn, opacity: waiting === 0 ? 0.5 : 1 }}
      >
        {callingNext ? "Calling..." : "📣 CALL NEXT"}
      </button>

      {loading ? (
        <p style={{ color: "#888", padding: "24px" }}>Loading queue...</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "#888", padding: "24px" }}>No active guests in queue</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Party</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Waiting</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.id} style={{ background: STATUS_COLORS[entry.status] ?? "#fff" }}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{entry.guestName ?? "—"}</td>
                  <td style={styles.td}>{entry.partySize}</td>
                  <td style={styles.td}>{entry.phoneE164}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{entry.status}</span>
                  </td>
                  <td style={styles.td}>{timeAgo(entry.createdAt)}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleAction(entry.id, "seat")}
                      style={{ ...styles.actionBtn, background: "#2563eb", color: "#fff" }}
                    >
                      Seat
                    </button>
                    <button
                      onClick={() => handleAction(entry.id, "skip")}
                      style={{ ...styles.actionBtn, background: "#9ca3af", color: "#fff" }}
                    >
                      Skip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={styles.refresh}>Auto-refreshes every 10 seconds</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "system-ui, sans-serif",
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "16px" },
  title: { fontSize: "24px", fontWeight: 700, margin: 0 },
  stats: { display: "flex", gap: "8px" },
  stat: { padding: "6px 14px", borderRadius: "999px", fontSize: "14px", fontWeight: 600 },
  message: {
    background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534",
    padding: "10px 16px", borderRadius: "8px", marginBottom: "12px", fontSize: "14px",
  },
  callBtn: {
    padding: "14px 32px", background: "#16a34a", color: "#fff",
    border: "none", borderRadius: "10px", fontSize: "16px",
    fontWeight: 700, cursor: "pointer", marginBottom: "20px",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #e5e7eb", fontWeight: 600, color: "#374151" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f3f4f6" },
  badge: { fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(0,0,0,0.06)" },
  actionBtn: { padding: "5px 12px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600, marginRight: "6px" },
  refresh: { fontSize: "11px", color: "#bbb", marginTop: "24px" },
};
