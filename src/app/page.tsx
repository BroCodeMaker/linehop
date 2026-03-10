import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fefce8 100%)", margin: 0 }}>
      {/* Hero */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", padding: "64px 24px 48px" }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>🍽️</div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, color: "#111827", lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.03em" }}>
          Scapă de cozi.
          <br />
          <span style={{ color: "#f97316" }}>Intri când ți-e rândul.</span>
        </h1>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#6b7280", maxWidth: 520, marginBottom: 40, lineHeight: 1.6 }}>
          Sistem inteligent de așteptare pentru restaurante. Clienții primesc notificare WhatsApp când le vine rândul.
        </p>
        <Link
          href="/app/login"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            padding: "16px 40px",
            borderRadius: 16,
            textDecoration: "none",
            boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          Înregistrează-ți locația →
        </Link>
      </section>

      {/* How it works */}
      <section style={{ padding: "0 24px 96px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, textAlign: "center", color: "#1f2937", marginBottom: 48 }}>
          Cum funcționează?
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {/* Step 1 */}
          <div style={card("#fff7ed", "#fed7aa")}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📱</div>
            <div style={stepBadge("#ffedd5", "#c2410c")}>Pasul 1</div>
            <h3 style={cardTitle}>Scanezi QR</h3>
            <p style={cardDesc}>
              Scanezi codul QR de la intrarea restaurantului și te înscrii în coadă de pe telefon, fără să aștepți la ușă.
            </p>
          </div>

          {/* Step 2 */}
          <div style={card("#eff6ff", "#bfdbfe")}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>💬</div>
            <div style={stepBadge("#dbeafe", "#1d4ed8")}>Pasul 2</div>
            <h3 style={cardTitle}>Primești notificare</h3>
            <p style={cardDesc}>
              Când îți vine rândul, primești un mesaj WhatsApp. Poți să te plimbi liber — nu trebuie să aștepți la ușă.
            </p>
          </div>

          {/* Step 3 */}
          <div style={card("#f0fdf4", "#bbf7d0")}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🪑</div>
            <div style={stepBadge("#dcfce7", "#15803d")}>Pasul 3</div>
            <h3 style={cardTitle}>Vii când ești chemat</h3>
            <p style={cardDesc}>
              Confirmi că ești pe drum și ajungi la restaurant — masa ta te așteaptă. Simplu, fără stres.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 64, textAlign: "center" }}>
          <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 16 }}>Ești administrator de restaurant?</p>
          <Link
            href="/app/login"
            style={{
              display: "inline-block",
              background: "#111827",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              padding: "12px 32px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            👨‍🍳 Intră în dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function card(bg: string, border: string): React.CSSProperties {
  return {
    background: bg,
    border: `2px solid ${border}`,
    borderRadius: 24,
    padding: "32px 28px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  };
}

function stepBadge(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    fontWeight: 700,
    fontSize: 12,
    borderRadius: 9999,
    padding: "4px 14px",
    display: "inline-block",
  };
}

const cardTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: "#111827",
  margin: 0,
};

const cardDesc: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 14,
  lineHeight: 1.6,
  margin: 0,
};
