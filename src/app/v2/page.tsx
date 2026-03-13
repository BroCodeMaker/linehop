export default function LandingV2() {
  return (
    <main style={{ fontFamily: "sans-serif", color: "#111827", backgroundColor: "#ffffff" }}>
      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", backgroundColor: "#ffffff", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", width: "100%", display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "center" }}>
          {/* Left */}
          <div style={{ flex: "1 1 360px" }}>
            <span style={{ display: "inline-block", backgroundColor: "#fff7ed", color: "#ea580c", fontSize: "0.875rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "9999px", marginBottom: "1.5rem" }}>
              🍽️ Para restaurante
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: "1.5rem", color: "#111827" }}>
              Restaurantul este plin?<br />
              <span style={{ color: "#f97316" }}>Nu mai pierde clienți</span> care pleacă.
            </h1>
            <p style={{ fontSize: "1.125rem", color: "#4b5563", marginBottom: "2rem", lineHeight: 1.7 }}>
              Clienții scanează QR-ul și intră în lista de așteptare. Îi anunți pe WhatsApp când masa este gata.
            </p>
            <a
              href="mailto:contact@linehop.ro"
              style={{ display: "inline-block", backgroundColor: "#f97316", color: "#ffffff", fontWeight: 700, fontSize: "1.125rem", padding: "1rem 2rem", borderRadius: "0.75rem", textDecoration: "none", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}
            >
              Programează demo →
            </a>
            <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#9ca3af" }}>Primele 30 zile gratuit. Fără card de credit.</p>
          </div>

          {/* Right */}
          <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            {/* QR mockup */}
            <div style={{ backgroundColor: "#ffffff", border: "2px solid #f3f4f6", boxShadow: "0 20px 40px rgba(0,0,0,0.12)", borderRadius: "1rem", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", width: "16rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>QR LineHop</p>
              <div style={{ width: "10rem", height: "10rem", border: "2px solid #e5e7eb", borderRadius: "0.5rem", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", padding: "0.5rem", backgroundColor: "#ffffff" }}>
                {Array.from({ length: 49 }).map((_, i) => {
                  const corners = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48];
                  const inner = [8,9,10,15,16,17,22,23,24];
                  const filled = corners.includes(i) || inner.includes(i) || (i % 3 === 0 && i > 28) || (i === 11) || (i === 37) || (i === 33);
                  return (
                    <div
                      key={i}
                      style={{ borderRadius: "2px", backgroundColor: filled ? "#111827" : "#ffffff" }}
                    />
                  );
                })}
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, margin: 0 }}>Scanează pentru a intra în coadă</p>
            </div>

            {/* Phone status card */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", borderRadius: "1rem", padding: "1.25rem 1.5rem", width: "16rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "0.5rem", height: "0.5rem", borderRadius: "9999px", backgroundColor: "#4ade80" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a" }}>Live</span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>Poziția ta în coadă</p>
              <p style={{ fontSize: "1.875rem", fontWeight: 800, color: "#f97316", margin: 0 }}>#1</p>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>Timp estimat: <span style={{ fontWeight: 600, color: "#111827" }}>~15 min</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ backgroundColor: "#fff7ed", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2rem)", fontWeight: 800, textAlign: "center", marginBottom: "3rem", color: "#111827" }}>Cum funcționează?</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "1.5rem", borderTop: "4px solid #fb923c", flex: "1 1 260px", maxWidth: "340px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
              <h3 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.5rem", color: "#111827" }}>Scanezi QR</h3>
              <p style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                Scanezi codul QR de la intrarea restaurantului și te înscrii în coadă direct de pe telefon.
              </p>
            </div>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "1.5rem", borderTop: "4px solid #60a5fa", flex: "1 1 260px", maxWidth: "340px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div>
              <h3 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.5rem", color: "#111827" }}>Primești actualizări</h3>
              <p style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                Vezi poziția în coadă și timpul estimat de așteptare.
              </p>
            </div>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "1.5rem", borderTop: "4px solid #4ade80", flex: "1 1 260px", maxWidth: "340px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
              <h3 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.5rem", color: "#111827" }}>Vii când ești chemat</h3>
              <p style={{ color: "#4b5563", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                Primești notificare WhatsApp când masa este aproape gată și confirmi că ești pe drum.
              </p>
            </div>
          </div>
          <p style={{ textAlign: "center", marginTop: "2.5rem", color: "#6b7280", fontWeight: 500 }}>
            Mai puțin haos la intrare. Clienți mai relaxați.
          </p>
        </div>
      </section>

      {/* BENEFITS RESTAURANT */}
      <section style={{ backgroundColor: "#ffffff", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2rem)", fontWeight: 800, textAlign: "center", marginBottom: "3rem", color: "#111827" }}>Beneficii pentru restaurant</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
            <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem" }}>🪑</span>
                <div>
                  <p style={{ fontWeight: 700, color: "#111827", margin: "0 0 0.25rem" }}>Crește gradul de ocupare</p>
                  <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: 0 }}>Mesele libere sunt ocupate mai rapid de grupuri potrivite.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem" }}>📋</span>
                <div>
                  <p style={{ fontWeight: 700, color: "#111827", margin: "0 0 0.25rem" }}>Listă de așteptare clară și automată</p>
                  <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: 0 }}>Fără hârtie, fără confuzii.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem" }}>😌</span>
                <div>
                  <p style={{ fontWeight: 700, color: "#111827", margin: "0 0 0.25rem" }}>Hostessul nu mai gestionează manual coada</p>
                  <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: 0 }}>Se concentrează pe experiența clienților, nu pe liste.</p>
                </div>
              </div>
            </div>
            <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem" }}>❓</span>
                <div>
                  <p style={{ fontWeight: 700, color: "#111827", margin: "0 0 0.25rem" }}>Clienții văd poziția în coadă și timpul estimat</p>
                  <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: 0 }}>Mai puține întrebări la intrare.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem" }}>🏃</span>
                <div>
                  <p style={{ fontWeight: 700, color: "#111827", margin: "0 0 0.25rem" }}>Mai puțin haos la intrare</p>
                  <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: 0 }}>Fluxul de intrare devine predictibil și calm.</p>
                </div>
              </div>
            </div>
          </div>
          <p style={{ textAlign: "center", marginTop: "3rem", color: "#9ca3af", fontStyle: "italic", fontSize: "0.875rem" }}>
            Mai puțin stres la intrare și mese ocupate mai eficient.
          </p>
        </div>
      </section>

      {/* BENEFITS CLIENTS */}
      <section style={{ backgroundColor: "#f9fafb", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2rem)", fontWeight: 800, textAlign: "center", marginBottom: "3rem", color: "#111827" }}>
            Experiență mai bună pentru clienți
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center" }}>
            {[
              { icon: "🚶", text: "Nu mai stau la coadă la ușă" },
              { icon: "🗺️", text: "Pot merge la plimbare până vine masa" },
              { icon: "📊", text: "Văd poziția în timp real" },
              { icon: "📱", text: "Primesc notificare WhatsApp" },
            ].map((item) => (
              <div
                key={item.text}
                style={{ backgroundColor: "#ffffff", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.75rem", flex: "1 1 160px", maxWidth: "220px" }}
              >
                <span style={{ fontSize: "2.5rem" }}>{item.icon}</span>
                <p style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.875rem", lineHeight: 1.4, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: "2.5rem", color: "#6b7280", fontWeight: 500 }}>
            Clienții așteaptă mai puțin și sunt mai relaxați.
          </p>
        </div>
      </section>

      {/* DEMO VISUAL */}
      <section style={{ backgroundColor: "#1f2937", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2rem)", fontWeight: 800, textAlign: "center", marginBottom: "3rem", color: "#ffffff" }}>Cum arată în practică</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
            {/* Dashboard mockup */}
            <div style={{ backgroundColor: "#374151", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", flex: "1 1 320px", maxWidth: "480px" }}>
              <p style={{ color: "#ffffff", fontWeight: 700, marginBottom: "1rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Restaurantul vede lista de așteptare
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { name: "Popescu Ion", guests: "4 pers", time: "12 min", status: "WAITING" },
                  { name: "Ionescu Maria", guests: "2 pers", time: "8 min", status: "CALLED" },
                  { name: "Dumitru Alex", guests: "6 pers", time: "20 min", status: "WAITING" },
                  { name: "Georgescu Ana", guests: "3 pers", time: "5 min", status: "CONFIRMED" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#4b5563", borderRadius: "0.75rem", padding: "0.75rem 1rem" }}>
                    <div>
                      <p style={{ color: "#ffffff", fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>{row.name}</p>
                      <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: 0 }}>{row.guests} · {row.time}</p>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "9999px", backgroundColor: row.status === "WAITING" ? "#f97316" : row.status === "CALLED" ? "#3b82f6" : "#22c55e", color: "#ffffff" }}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "1 1 240px" }}>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", padding: "1.5rem", width: "18rem", border: "4px solid #4b5563" }}>
                <p style={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                  Clientul vede poziția sa
                </p>
                <div style={{ backgroundColor: "#fff7ed", borderRadius: "1rem", padding: "1.25rem", textAlign: "center", marginBottom: "1rem" }}>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Ești în lista de așteptare</p>
                  <p style={{ fontSize: "3rem", fontWeight: 800, color: "#f97316", margin: 0 }}>#3</p>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    Timp estimat: <span style={{ fontWeight: 700, color: "#111827" }}>~20 min</span>
                  </p>
                </div>
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.75rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>📱</span>
                  <p style={{ fontSize: "0.875rem", color: "#15803d", fontWeight: 500, margin: 0 }}>Te anunțăm pe WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: "linear-gradient(to right, #f97316, #ea580c)", padding: "5rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, color: "#ffffff", marginBottom: "1rem" }}>
            Vrei să testezi LineHop în restaurantul tău?
          </h2>
          <p style={{ color: "#ffedd5", fontSize: "1.125rem", marginBottom: "2rem" }}>Primele 30 zile gratuit. Setup în 5 minute.</p>
          <a
            href="/app/login"
            style={{ display: "inline-block", backgroundColor: "#ffffff", color: "#ea580c", fontWeight: 800, fontSize: "1.125rem", padding: "1rem 2.5rem", borderRadius: "0.75rem", textDecoration: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
          >
            Încearcă LineHop gratuit →
          </a>
        </div>
      </section>

      {/* CONTACT */}
      <section style={{ backgroundColor: "#ffffff", padding: "4rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem", color: "#111827" }}>Contact LineHop</h2>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Suntem aici să te ajutăm.</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <a
              href="tel:0750198891"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#374151", textDecoration: "none", fontWeight: 500 }}
            >
              <span>📞</span> 0750 198 891
            </a>
            <a
              href="mailto:contact@linehop.ro"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#374151", textDecoration: "none", fontWeight: 500 }}
            >
              <span>✉️</span> contact@linehop.ro
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#f9fafb", borderTop: "1px solid #f3f4f6", padding: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "#9ca3af" }}>
        © 2026 LineHop · contact@linehop.ro · Toate drepturile rezervate
      </footer>
    </main>
  );
}
