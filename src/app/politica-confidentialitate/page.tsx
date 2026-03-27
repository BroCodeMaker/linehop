import Link from "next/link";

export default function PoliticaConfidentialitate() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif", color: "#111827" }}>
      <nav style={{ borderBottom: "1px solid #f3f4f6", padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/" style={{ fontSize: "1.25rem", fontWeight: 900, color: "#E87722", textDecoration: "none" }}>LineHop</Link>
      </nav>
      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1.5rem" }}>Politică de confidențialitate</h1>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Ultima actualizare: Martie 2026</p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>1. Date colectate</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          LineHop colectează numărul de telefon și numele opțional al clienților care se înscriu în lista de așteptare.
          Aceste date sunt folosite exclusiv pentru a trimite notificări WhatsApp privind disponibilitatea mesei.
        </p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>2. Utilizarea datelor</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          Numărul de telefon este colectat EXCLUSIV pentru a trimite o notificare WhatsApp când masa din restaurant este disponibilă. Scopul prelucrării: notificare punctuală privind disponibilitatea locului în lista de așteptare.
        </p>
        <p style={{ lineHeight: 1.7, color: "#374151", marginTop: "0.75rem" }}>
          Nu folosim numărul pentru marketing, nu îl stocăm după finalizarea sesiunii de așteptare și nu îl transmitem către terți în afara furnizorului de mesagerie WhatsApp (Meta Platforms, Inc.).
        </p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>3. Drepturile dumneavoastră</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          Puteți anula rezervarea în orice moment prin linkul primit pe WhatsApp. Pentru orice solicitare privind
          datele personale, contactați-ne la contact@linehop.ro.
        </p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>4. Contact</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          Email: contact@linehop.ro
        </p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>5. Temeiul legal</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          Prelucrarea se efectuează pe baza consimțământului explicit acordat de persoana vizată la momentul înscrierii în lista de așteptare (Art. 6 alin. (1) lit. a) GDPR). Consimțământul poate fi retras în orice moment prin anularea înscrierii via linkul primit pe WhatsApp.
        </p>

        <div style={{ marginTop: "3rem" }}>
          <Link href="/" style={{ color: "#E87722", textDecoration: "none", fontWeight: 600 }}>← Înapoi la pagina principală</Link>
        </div>
      </main>
    </div>
  );
}
