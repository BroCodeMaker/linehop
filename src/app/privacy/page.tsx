import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politică de confidențialitate — LineHop",
  description: "Cum colectăm, procesăm și protejăm datele tale personale.",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif", color: "#111827" }}>
      <nav style={{ borderBottom: "1px solid #f3f4f6", padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/" style={{ fontSize: "1.25rem", fontWeight: 900, color: "#E87722", textDecoration: "none" }}>LineHop</Link>
      </nav>
      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem" }}>Politică de confidențialitate</h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>Ultima actualizare: Martie 2026</p>

        <section>
          <h2 style={h2}>1. Date colectate</h2>
          <p style={p}>
            LineHop colectează următoarele date cu caracter personal atunci când un client se înscrie în lista de
            așteptare a unui restaurant:
          </p>
          <ul style={ul}>
            <li><strong>Număr de telefon</strong> — folosit pentru trimiterea notificărilor WhatsApp</li>
            <li><strong>Nume (opțional)</strong> — pentru personalizarea mesajelor</li>
            <li><strong>Dimensiunea grupului</strong> — numărul de persoane</li>
            <li><strong>Notă (opțională)</strong> — preferințe speciale transmise restaurantului</li>
            <li><strong>Timestamp de înscriere</strong> — momentul înregistrării în coadă</li>
            <li><strong>Timp de așteptare estimat</strong> — calculat automat în baza datelor din coadă</li>
            <li><strong>Consimțământ GDPR</strong> — data și ora acordării consimțământului</li>
          </ul>
        </section>

        <section>
          <h2 style={h2}>2. Scopul prelucrării</h2>
          <p style={p}>
            Datele colectate sunt folosite pentru <strong>gestionarea listei de așteptare a restaurantului</strong> și
            pentru <strong>scopuri statistice interne</strong>:
          </p>
          <ul style={ul}>
            <li>Trimiterea notificărilor WhatsApp privind disponibilitatea mesei</li>
            <li>Calculul timpului de așteptare estimat</li>
            <li>Permiterea clientului să urmărească statutul locului în coadă</li>
            <li>Statistici agregate pentru restaurante (ex. timp mediu așteptare, ore de vârf) — în vederea bunei gestionări a activității și îmbunătățirii aplicației</li>
          </ul>
          <p style={p}>
            Datele nu sunt transmise unor terți și nu sunt folosite în scop publicitar.
            Statisticile sunt generate exclusiv pe baza datelor anonimizate sau agregate, fără a permite identificarea
            individuală a clienților.
          </p>
        </section>

        <section>
          <h2 style={h2}>3. Stocarea datelor</h2>
          <p style={p}>
            Datele sunt stocate într-o bază de date PostgreSQL securizată găzduită pe infrastructura Neon (cloud UE/SUA).
            Accesul la date este restricționat la personalul autorizat al restaurantului și echipei LineHop.
          </p>
        </section>

        <section>
          <h2 style={h2}>4. Retenția datelor</h2>
          <p style={p}>
            Datele personale (număr telefon, nume) sunt păstrate timp de <strong>maximum 30 de zile</strong> de la
            ieșirea din coadă (prin alocare masă, anulare sau expirare), după care sunt șterse automat sau
            anonimizate.
          </p>
        </section>

        <section>
          <h2 style={h2}>5. Drepturile dumneavoastră</h2>
          <p style={p}>În conformitate cu Regulamentul (UE) 2016/679 (GDPR), aveți dreptul la:</p>
          <ul style={ul}>
            <li><strong>Acces</strong> — să solicitați o copie a datelor stocate despre dvs.</li>
            <li><strong>Rectificare</strong> — să corectați datele inexacte</li>
            <li><strong>Ștergere</strong> — să solicitați ștergerea datelor („dreptul de a fi uitat")</li>
            <li><strong>Restricționarea prelucrării</strong> — în anumite circumstanțe</li>
            <li><strong>Portabilitate</strong> — să primiți datele într-un format structurat</li>
            <li><strong>Opoziție</strong> — să vă opuneți prelucrării</li>
          </ul>
          <p style={p}>
            Pentru orice solicitare legată de datele personale, contactați-ne la:{" "}
            <a href="mailto:contact@linehop.ro" style={{ color: "#E87722" }}>contact@linehop.ro</a>
          </p>
        </section>

        <section>
          <h2 style={h2}>6. Roluri GDPR</h2>
          <p style={p}>
            <strong>LineHop</strong> acționează în calitate de <strong>procesator de date</strong>, furnizând platforma
            tehnică. <strong>Restaurantul</strong> este <strong>operatorul de date</strong> responsabil de colectarea
            consimțământului și utilizarea corectă a platformei.
          </p>
        </section>

        <section>
          <h2 style={h2}>7. Cookie-uri</h2>
          <p style={p}>
            Folosim exclusiv cookie-uri esențiale pentru funcționarea aplicației (sesiune, preferințe locale).
            Nu folosim cookie-uri de tracking sau publicitate.
          </p>
        </section>

        <section>
          <h2 style={h2}>8. Contact</h2>
          <p style={p}>
            Operator: LineHop SRL (în curs de înregistrare)<br />
            Email: <a href="mailto:contact@linehop.ro" style={{ color: "#E87722" }}>contact@linehop.ro</a>
          </p>
        </section>

        <div style={{ marginTop: "3rem" }}>
          <Link href="/" style={{ color: "#E87722", textDecoration: "none", fontWeight: 600 }}>← Înapoi la pagina principală</Link>
        </div>
      </main>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 700, margin: "2rem 0 0.75rem", color: "#111827" };
const p: React.CSSProperties = { lineHeight: 1.7, color: "#374151", margin: "0 0 0.75rem" };
const ul: React.CSSProperties = { lineHeight: 1.8, color: "#374151", paddingLeft: "1.5rem", margin: "0 0 0.75rem" };
