import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fefce8 100%)", margin: 0 }}>
      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: "#f97316", letterSpacing: "-0.02em" }}>LineHop</span>
        <Link
          href="/app/login"
          style={{ background: "#111827", color: "#fff", fontWeight: 700, fontSize: 14, padding: "10px 24px", borderRadius: 10, textDecoration: "none" }}
        >
          Login
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "56px 24px 48px" }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🍽️</div>
        <h1 style={{ fontSize: "clamp(32px, 5.5vw, 60px)", fontWeight: 900, color: "#111827", lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.03em", maxWidth: 780 }}>
          Nu mai pierde clienți când
          <br />
          <span style={{ color: "#f97316" }}>restaurantul este plin.</span>
        </h1>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#6b7280", maxWidth: 560, marginBottom: 40, lineHeight: 1.65 }}>
          LineHop permite clienților să intre în lista de așteptare prin scanarea unui QR și îi anunță pe WhatsApp când masa este gata.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/app/login"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
              padding: "16px 40px",
              borderRadius: 16,
              textDecoration: "none",
              boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
            }}
          >
            Testează LineHop gratuit →
          </Link>
          <a
            href="mailto:contact@linehop.ro"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#111827",
              fontWeight: 700,
              fontSize: 17,
              padding: "16px 40px",
              borderRadius: 16,
              textDecoration: "none",
              border: "2px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            Programează un demo
          </a>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "0 24px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, textAlign: "center", color: "#1f2937", marginBottom: 40 }}>
          Cum funcționează?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          <div style={card("#fff7ed", "#fed7aa")}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
            <div style={stepBadge("#ffedd5", "#c2410c")}>Pasul 1</div>
            <h3 style={cardTitle}>Scanezi QR</h3>
            <p style={cardDesc}>Scanezi codul QR de la intrarea restaurantului și te înscrii în coadă direct de pe telefon.</p>
          </div>
          <div style={card("#eff6ff", "#bfdbfe")}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💬</div>
            <div style={stepBadge("#dbeafe", "#1d4ed8")}>Pasul 2</div>
            <h3 style={cardTitle}>Primești notificare</h3>
            <p style={cardDesc}>Când îți vine rândul, primești un mesaj WhatsApp. Te poți plimba liber — nu mai aștepți la ușă.</p>
          </div>
          <div style={card("#f0fdf4", "#bbf7d0")}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🪑</div>
            <div style={stepBadge("#dcfce7", "#15803d")}>Pasul 3</div>
            <h3 style={cardTitle}>Vii când ești chemat</h3>
            <p style={cardDesc}>Confirmi că ești pe drum și ajungi la restaurant — masa ta te așteaptă. Simplu, fără stres.</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: "0 24px 80px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, textAlign: "center", color: "#1f2937", marginBottom: 40 }}>
          Beneficii
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {/* Restaurant */}
          <div style={{ background: "#fff", border: "2px solid #fed7aa", borderRadius: 24, padding: "32px 28px" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🏪</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 20 }}>Pentru restaurant</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Mai puțini clienți pierduți",
                "Mai puțin haos la intrare",
                "Clienții știu timpul estimat",
                "Lista gestionată automat",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#374151", fontSize: 15, lineHeight: 1.5 }}>
                  <span style={{ color: "#22c55e", fontWeight: 700, marginTop: 1 }}>✅</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Clients */}
          <div style={{ background: "#fff", border: "2px solid #bfdbfe", borderRadius: 24, padding: "32px 28px" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>👤</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 20 }}>Pentru clienți</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["📱", "Nu mai așteaptă la ușă"],
                ["🚶", "Pot merge la plimbare"],
                ["🔔", "Primesc notificare WhatsApp când masa e gata"],
              ].map(([icon, text]) => (
                <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#374151", fontSize: 15, lineHeight: 1.5 }}>
                  <span style={{ fontSize: 18, marginTop: -1 }}>{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ padding: "0 24px 80px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: "#fff", border: "2px solid #e5e7eb", borderRadius: 24, padding: "40px 32px" }}>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: "#111827", marginBottom: 8 }}>Contact LineHop</h2>
          <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 28 }}>Suntem aici să te ajutăm.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <a
              href="tel:0750198891"
              style={{ display: "flex", alignItems: "center", gap: 10, color: "#111827", textDecoration: "none", fontSize: 17, fontWeight: 600 }}
            >
              <span style={{ fontSize: 22 }}>📞</span> 0750 198 891
            </a>
            <a
              href="mailto:contact@linehop.ro"
              style={{ display: "flex", alignItems: "center", gap: 10, color: "#f97316", textDecoration: "none", fontSize: 17, fontWeight: 600 }}
            >
              <span style={{ fontSize: 22 }}>✉️</span> contact@linehop.ro
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #f3f4f6", textAlign: "center", padding: "24px 16px", color: "#9ca3af", fontSize: 13 }}>
        © {new Date().getFullYear()} LineHop · Restaurant Waitlist Management
        <span style={{ margin: "0 8px" }}>·</span>
        <Link href="/app/login" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Dashboard</Link>
      </footer>
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
    gap: 10,
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
