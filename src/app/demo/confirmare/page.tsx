"use client";

import { useEffect, useState } from "react";

export default function DemoConfirmarePage() {
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    const p = sessionStorage.getItem("demoPosition");
    setPosition(p ? Number(p) : 1);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", fontFamily: "'Inter', sans-serif", color: "#111827" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #E87722, #d96a18)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "1.375rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>LineHop</span>
        </a>
        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Lista de așteptare</span>
      </div>

      {/* Status badge */}
      <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 1.5rem 0" }}>
        <span style={{ backgroundColor: "#fff8f2", color: "#E87722", fontWeight: 700, fontSize: "0.875rem", padding: "0.4rem 1.25rem", borderRadius: "999px", border: "2px solid #fed7aa" }}>
          În așteptare
        </span>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: "420px", margin: "0 auto", padding: "1.5rem" }}>

        {/* Position card */}
        <div style={{ backgroundColor: "#fff", borderRadius: "1.5rem", padding: "2.5rem 2rem", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", fontWeight: 600, marginBottom: "0.5rem" }}>Poziția ta</p>
          <div style={{ fontSize: "clamp(3rem, 18vw, 4.5rem)", fontWeight: 900, color: "#E87722", lineHeight: 1, marginBottom: "0.5rem" }}>
            #{position ?? "—"}
          </div>
          <p style={{ fontSize: "0.975rem", color: "#6b7280", margin: 0 }}>restaurante înaintea ta</p>
        </div>

        {/* WhatsApp confirmation card */}
        <div style={{ backgroundColor: "#f0fdf4", borderRadius: "1.25rem", padding: "1.25rem 1.5rem", border: "1.5px solid #bbf7d0", marginBottom: "1rem" }}>
          <p style={{ fontWeight: 700, color: "#166534", fontSize: "0.95rem", margin: "0 0 0.25rem" }}>
            📱 Ți-am trimis confirmare pe WhatsApp
          </p>
          <p style={{ color: "#15803d", fontSize: "0.875rem", margin: 0 }}>
            Te sunăm în maxim 24h pentru setup gratuit
          </p>
        </div>

        {/* Time card */}
        <div style={{ backgroundColor: "#fff", borderRadius: "1.25rem", padding: "1.25rem 1.5rem", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "1rem" }}>
          <p style={{ fontWeight: 600, color: "#374151", fontSize: "0.95rem", margin: 0 }}>
            ⏱️ Timp estimat: 24h
          </p>
        </div>

        {/* Insight card */}
        <div style={{ backgroundColor: "#fff8f2", borderRadius: "1.25rem", padding: "1.5rem", border: "2px solid #fed7aa", marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#92400e", lineHeight: 1.6, margin: "0 0 0.5rem" }}>
            Cam așa se simte și clientul tău când îl adaugi în LineHop.
          </p>
          <p style={{ fontSize: "0.9rem", color: "#b45309", lineHeight: 1.6, margin: 0 }}>
            Relaxat. Informat. Fără să stea la ușă cu telefonul în mână.
          </p>
        </div>

        {/* PS */}
        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#9ca3af", fontStyle: "italic" }}>
          P.S. Dacă nu te sunăm în 24h, e greșeala noastră — nu a ta.
        </p>
      </div>
    </div>
  );
}
