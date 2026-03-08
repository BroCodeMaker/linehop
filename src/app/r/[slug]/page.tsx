"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [partySize, setPartySize] = useState(2);
  const [phone, setPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/public/restaurants/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partySize, phone, guestName: guestName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push(data.statusUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🍽️ Join Waitlist</h1>
        <p style={styles.subtitle}>Restaurant: <strong>{slug}</strong></p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Party size</label>
          <select
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            style={styles.input}
            required
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
            ))}
          </select>

          <label style={styles.label}>Phone number (WhatsApp)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xx xxx xxx"
            style={styles.input}
            required
          />

          <label style={styles.label}>Name (optional)</label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Your name"
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Joining..." : "Join Waitlist →"}
          </button>
        </form>
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
  },
  title: { fontSize: "28px", fontWeight: 700, margin: "0 0 4px 0" },
  subtitle: { color: "#666", marginBottom: "24px", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#444" },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "16px",
    marginBottom: "8px",
    outline: "none",
  },
  button: {
    marginTop: "8px",
    padding: "14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { color: "#dc2626", fontSize: "14px", margin: "4px 0" },
};
