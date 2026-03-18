import Link from "next/link";

export default function Termeni() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif", color: "#111827" }}>
      <nav style={{ borderBottom: "1px solid #f3f4f6", padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/" style={{ fontSize: "1.25rem", fontWeight: 900, color: "#E87722", textDecoration: "none" }}>LineHop</Link>
      </nav>
      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1.5rem" }}>Termeni și condiții</h1>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Ultima actualizare: Martie 2026</p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>1. Serviciul LineHop</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          LineHop este o platformă de gestionare a listei de așteptare pentru restaurante. Prin utilizarea
          serviciului, clienții și restaurantele acceptă acești termeni.
        </p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>2. Utilizare corectă</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          Serviciul este destinat exclusiv gestionării listei de așteptare. Nu este permisă utilizarea abuzivă
          sau înregistrarea de date false.
        </p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>3. Răspundere</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          LineHop nu este responsabil pentru situațiile în care restaurantul nu poate onora rezervările din cauze
          de forță majoră sau capacitate insuficientă.
        </p>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "2rem 0 0.75rem" }}>4. Contact</h2>
        <p style={{ lineHeight: 1.7, color: "#374151" }}>
          Email: contact@linehop.ro
        </p>

        <div style={{ marginTop: "3rem" }}>
          <Link href="/" style={{ color: "#E87722", textDecoration: "none", fontWeight: 600 }}>← Înapoi la pagina principală</Link>
        </div>
      </main>
    </div>
  );
}
