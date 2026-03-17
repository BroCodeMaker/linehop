"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const router = useRouter();
  const [form, setForm] = useState({ restaurantName: "", phone: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Eroare. Încearcă din nou."); return; }
      sessionStorage.setItem("demoPosition", String(data.position));
      router.push("/demo/confirmare");
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif", color: "#111827", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <nav style={{ borderBottom: "1px solid #f3f4f6", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#E87722", letterSpacing: "-0.03em" }}>LineHop</span>
        </a>
        <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Setup gratuit · Fără card</span>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "1.5rem", padding: "2.5rem", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#111827", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              Înscrie restaurantul tău
            </h1>
            <p style={{ fontSize: "1rem", color: "#6b7280", marginBottom: "2rem" }}>
              Setup gratuit, te contactăm în 24h
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.375rem" }}>
                  Numele restaurantului
                </label>
                <input
                  type="text"
                  placeholder="ex: Trattoria Bella"
                  value={form.restaurantName}
                  onChange={e => setForm(f => ({ ...f, restaurantName: e.target.value }))}
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "2px solid #e5e7eb", fontSize: "1rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={e => (e.target.style.borderColor = "#E87722")}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.375rem" }}>
                  Telefon WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+40 7xx xxx xxx"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "2px solid #e5e7eb", fontSize: "1rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={e => (e.target.style.borderColor = "#E87722")}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.375rem" }}>
                  Orașul
                </label>
                <input
                  type="text"
                  placeholder="ex: Cluj-Napoca"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "2px solid #e5e7eb", fontSize: "1rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={e => (e.target.style.borderColor = "#E87722")}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              {error && (
                <p style={{ color: "#ef4444", fontSize: "0.875rem", margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: loading ? "#f97316" : "#E87722", color: "#fff", fontWeight: 700, fontSize: "1.05rem", padding: "0.9rem 1.5rem", borderRadius: "1rem", border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 18px rgba(232,119,34,0.4)", marginTop: "0.5rem", transition: "opacity 0.15s", opacity: loading ? 0.8 : 1 }}
              >
                {loading ? "Se procesează..." : "Intru în listă →"}
              </button>

              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>
                🔒 Nu trimitem spam. Promis.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
