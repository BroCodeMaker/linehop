"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FOOD_BG = `radial-gradient(ellipse at 15% 15%, rgba(251,146,60,0.15) 0%, transparent 45%),
  radial-gradient(ellipse at 85% 85%, rgba(234,179,8,0.10) 0%, transparent 45%),
  radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.05) 0%, transparent 60%),
  #fdf6ee`;

const FOOD_ITEMS = [
  { emoji: "🍕", top: "5%",  left: "3%",   size: 52, op: 0.14, rot: -15 },
  { emoji: "🍝", top: "8%",  right: "5%",  size: 44, op: 0.12, rot: 20  },
  { emoji: "🥗", top: "30%", left: "1%",   size: 38, op: 0.09, rot: 10  },
  { emoji: "🍷", top: "55%", right: "2%",  size: 42, op: 0.10, rot: -20 },
  { emoji: "🥩", bottom: "12%", left: "4%", size: 40, op: 0.11, rot: 15 },
  { emoji: "🍰", bottom: "6%", right: "3%", size: 48, op: 0.13, rot: -8 },
  { emoji: "🫕", top: "70%", left: "0%",   size: 36, op: 0.08, rot: 5  },
  { emoji: "🥂", top: "40%", right: "0%",  size: 38, op: 0.09, rot: -5 },
];

export default function HomePage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [showSlugInput, setShowSlugInput] = useState(false);

  function handleCustomerGo() {
    const s = slug.trim().toLowerCase();
    if (s) router.push(`/r/${s}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: FOOD_BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", position: "relative", padding: "16px" }}>
      {/* Food decorations */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        {FOOD_ITEMS.map((f, i) => (
          <div key={i} style={{ position: "absolute", fontSize: f.size, opacity: f.op, transform: `rotate(${f.rot}deg)`, top: f.top, right: (f as {right?: string}).right, bottom: f.bottom, left: f.left }}>
            {f.emoji}
          </div>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        {/* Logo / Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🍽️</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
            WaitList
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 15, marginTop: 6 }}>
            Sistem inteligent de așteptare pentru restaurante
          </p>
        </div>

        {/* Restaurant button */}
        <a href="/app/login" style={{ textDecoration: "none" }}>
          <div style={s.bigCard("#ea580c", "#dc2626", "#fff8f0", "#fed7aa")}>
            <div style={s.cardIcon}>👨‍🍳</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#1a1a1a", marginBottom: 4 }}>
                Sunt Restaurant
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
                Gestionează coada de așteptare,<br />cheamă clienți, marchează locuri
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 22, color: "#ea580c" }}>→</div>
          </div>
        </a>

        {/* Customer button */}
        {!showSlugInput ? (
          <button onClick={() => setShowSlugInput(true)} style={{ ...s.bigCard("#2563eb", "#1d4ed8", "#eff6ff", "#bfdbfe"), border: "none", width: "100%", cursor: "pointer", textAlign: "left" as const }}>
            <div style={s.cardIcon}>🧑‍💼</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#1a1a1a", marginBottom: 4 }}>
                Sunt Client
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4 }}>
                Introdu codul restaurantului<br />sau scanează QR-ul de la intrare
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 22, color: "#2563eb" }}>→</div>
          </button>
        ) : (
          <div style={{ ...s.bigCard("#2563eb", "#1d4ed8", "#eff6ff", "#bfdbfe"), flexDirection: "column" as const, gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={s.cardIcon}>🧑‍💼</div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#1a1a1a" }}>Sunt Client</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                autoFocus
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomerGo()}
                placeholder="cod restaurant (ex: pizza-roma)"
                style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1.5px solid #bfdbfe", fontSize: 15, outline: "none", background: "#fff" }}
              />
              <button
                onClick={handleCustomerGo}
                disabled={!slug.trim()}
                style={{ padding: "11px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: slug.trim() ? 1 : 0.5 }}
              >
                Mergi
              </button>
            </div>
            <button onClick={() => setShowSlugInput(false)} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>
              Anulează
            </button>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "#d1d5db", marginTop: 24 }}>
          Clienții intră pe pagina restaurantului prin QR cod
        </p>
      </div>
    </div>
  );
}

const s = {
  bigCard: (from: string, to: string, bg: string, border: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: bg,
    border: `2px solid ${border}`,
    borderRadius: 16,
    padding: "20px 20px",
    marginBottom: 12,
    boxShadow: `0 4px 20px ${from}22`,
    transition: "transform 0.15s, box-shadow 0.15s",
    textDecoration: "none",
  }),
  cardIcon: { fontSize: 36, flexShrink: 0 } as React.CSSProperties,
};
