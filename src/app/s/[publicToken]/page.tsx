"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type EntryData = {
  status: string;
  partySize: number;
  guestName?: string;
  restaurantName: string;
  position?: number;
  calledAt?: string;
  confirmedAt?: string;
  seatedAt?: string;
  confirmDeadlineAt?: string;
  arrivalDeadlineAt?: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  WAITING:   { label: "Waiting",   color: "#92400e", bg: "#fef3c7", emoji: "⏳" },
  CALLED:    { label: "Called!",   color: "#9a3412", bg: "#fed7aa", emoji: "📲" },
  CONFIRMED: { label: "Confirmed", color: "#166534", bg: "#dcfce7", emoji: "✅" },
  SEATED:    { label: "Seated",    color: "#1e40af", bg: "#dbeafe", emoji: "🪑" },
  SKIPPED:   { label: "Skipped",   color: "#6b7280", bg: "#f3f4f6", emoji: "⏭️" },
  EXPIRED:   { label: "Expired",   color: "#6b7280", bg: "#f3f4f6", emoji: "⌛" },
  CANCELED:  { label: "Canceled",  color: "#6b7280", bg: "#f3f4f6", emoji: "❌" },
};

export default function StatusPage() {
  const { publicToken } = useParams<{ publicToken: string }>();
  const [data, setData] = useState<EntryData | null>(null);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState(false);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/public/entry/${publicToken}`);
      if (!res.ok) { setError("Entry not found"); return; }
      setData(await res.json());
    } catch { setError("Network error"); }
  }

  async function handleCancel() {
    setCanceling(true);
    try {
      const res = await fetch(`/api/public/entry/${publicToken}/cancel`, { method: "POST" });
      if (res.ok) {
        await fetchStatus();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Could not cancel"));
      }
    } finally {
      setCanceling(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicToken]);

  if (error) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={{ color: "#dc2626" }}>{error}</p>
      </div>
    </div>
  );

  if (!data) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p>Loading...</p>
      </div>
    </div>
  );

  const cfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG["WAITING"];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{data.restaurantName}</h1>
        {data.guestName && <p style={styles.name}>👤 {data.guestName}</p>}

        <div style={{ ...styles.badge, color: cfg.color, background: cfg.bg }}>
          {cfg.emoji} {cfg.label}
        </div>

        {(data.status === "WAITING" || data.status === "CALLED") && data.position && (
          <div style={styles.position}>
            <span style={styles.posNum}>{data.position}</span>
            <span style={styles.posLabel}>in queue</span>
          </div>
        )}

        <div style={styles.meta}>
          <span>🍽️ Party of {data.partySize}</span>
        </div>

        {data.status === "CALLED" && (
          <div style={styles.alert}>
            ⚡ Your table is ready! Please confirm within 2 minutes.
          </div>
        )}

        {data.status === "CONFIRMED" && (
          <div style={styles.success}>
            ✅ Confirmed! Please arrive soon.
          </div>
        )}

        {data.status === "SEATED" && (
          <div style={styles.success}>
            🎉 Enjoy your meal!
          </div>
        )}

        {data.status === "EXPIRED" && (
          <div style={{...styles.alert, background: "#fee2e2", color: "#991b1b"}}>
            ⏰ Your confirmation window expired
          </div>
        )}

        {data.status === "CANCELED" && (
          <div style={{...styles.alert, background: "#f3f4f6", color: "#6b7280"}}>
            ❌ Booking canceled
          </div>
        )}

        {["WAITING", "CALLED", "CONFIRMED"].includes(data.status) && (
          <button
            onClick={handleCancel}
            disabled={canceling}
            style={{...styles.cancelBtn, opacity: canceling ? 0.5 : 1}}
          >
            {canceling ? "Canceling..." : "Cancel Booking"}
          </button>
        )}

        <p style={styles.refresh}>Auto-refreshes every 15 seconds</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: "16px",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "32px 24px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  title: { fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0" },
  name: { color: "#666", fontSize: "15px", margin: "0 0 20px 0" },
  badge: {
    display: "inline-block",
    padding: "10px 24px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "18px",
    margin: "16px 0",
  },
  position: { margin: "16px 0", display: "flex", flexDirection: "column", alignItems: "center" },
  posNum: { fontSize: "64px", fontWeight: 800, lineHeight: 1, color: "#2563eb" },
  posLabel: { fontSize: "14px", color: "#888", marginTop: "4px" },
  meta: { color: "#666", fontSize: "14px", margin: "12px 0" },
  alert: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    margin: "12px 0",
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    margin: "12px 0",
  },
  cancelBtn: {
    marginTop: "20px",
    padding: "12px 24px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  refresh: { fontSize: "11px", color: "#bbb", marginTop: "24px" },
};
