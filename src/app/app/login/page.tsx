"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push(`/app/${data.restaurantId}/dashboard`);
    } catch {
      setError("Network error, please retry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>🍽️ Staff Login</h1>
        <p style={s.subtitle}>WaitList Dashboard</p>
        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@restaurant.com"
            required
            style={s.input}
            autoComplete="email"
          />
          <label style={s.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={s.input}
            autoComplete="current-password"
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? "Logging in..." : "Login →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    fontFamily: "system-ui, sans-serif",
    padding: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "40px 32px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: { fontSize: "28px", fontWeight: 700, margin: "0 0 4px 0" },
  subtitle: { color: "#888", marginBottom: "28px", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#444", marginTop: "8px" },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "16px",
    outline: "none",
    marginBottom: "4px",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "8px 12px",
    margin: "4px 0",
  },
  btn: {
    marginTop: "12px",
    padding: "14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
