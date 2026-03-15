"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type RestaurantInfo = {
  name: string;
  status: "OPEN" | "FULL" | "CLOSED" | "PAUSED";
  listClosed: boolean;
  queueLength: number;
  estimatedWaitMinutes: number;
  waitMinutesPerGroup: number;
  maxPartySize: number;
  maxQueueSize: number;
  queueFull: boolean;
};

const FOOD_BG = `radial-gradient(ellipse at 10% 20%, rgba(251,146,60,0.10) 0%, transparent 50%),
  radial-gradient(ellipse at 90% 80%, rgba(234,179,8,0.08) 0%, transparent 50%),
  #fdf6ee`;

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [info, setInfo] = useState<RestaurantInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [partySize, setPartySize] = useState(2);
  const [phone, setPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchInfo() {
    try {
      const res = await fetch(`/api/public/restaurants/${slug}/info`);
      if (res.ok) setInfo(await res.json());
    } finally {
      setLoadingInfo(false);
    }
  }

  useEffect(() => {
    fetchInfo();
    const t = setInterval(fetchInfo, 20000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/restaurants/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partySize, phone, guestName: guestName || undefined, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.blocked) {
          setError("Acest număr de telefon este deja înregistrat sau a participat la lista de așteptare.");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }
      router.push(data.statusUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInfo) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <div style={s.card}><p style={s.muted}>Se încarcă...</p></div>
    </div>
  );

  if (!info) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <div style={s.card}><p style={{ color: "#dc2626" }}>Restaurant negăsit.</p></div>
    </div>
  );

  if (info.status === "CLOSED") return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <div style={s.card}>
        <div style={s.headerEmoji}>🌙</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#f3f4f6", color: "#6b7280" }}>Restaurantul este închis</div>
        <p style={s.muted}>Ne vedem mâine! Vă mulțumim pentru vizită.</p>
      </div>
    </div>
  );

  if (info.status === "PAUSED") return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <div style={s.card}>
        <div style={s.headerEmoji}>⏸️</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#fef3c7", color: "#92400e" }}>Lista de așteptare este temporar în pauză</div>
        <p style={s.muted}>Vă rugăm să reveniți în câteva minute sau să contactați personalul restaurantului.</p>
      </div>
    </div>
  );

  // Lista închisă — clienții existenți în coadă nu sunt afectați
  if (info.listClosed) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <div style={s.card}>
        <div style={s.headerEmoji}>🔒</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#f3f4f6", color: "#374151" }}>Lista de așteptare este închisă momentan</div>
        <p style={s.muted}>Reveniți mai târziu sau contactați personalul restaurantului.</p>
      </div>
    </div>
  );

  if (info.queueFull) return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <div style={s.card}>
        <div style={s.headerEmoji}>⏳</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#fee2e2", color: "#991b1b" }}>
          Lista de așteptare este plină
        </div>
        <p style={{ fontSize: 15, color: "#374151", textAlign: "center", margin: "16px 0", lineHeight: 1.6 }}>
          În acest moment sunt <strong>{info.queueLength} persoane</strong> în fața dumneavoastră.
        </p>
        <p style={s.muted}>
          Vă rugăm să reveniți mai târziu. Când un loc se eliberează, lista se va redeschide automat.
        </p>
      </div>
    </div>
  );

  if (info.status === "OPEN") return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <div style={s.card}>
        <div style={s.headerEmoji}>🍽️</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#fef3c7", color: "#92400e" }}>
          Vă rugăm să intrați pentru alocarea locului la masă
        </div>
        <p style={{ fontSize: 15, color: "#374151", textAlign: "center", margin: "16px 0" }}>
          În acest moment nu există listă de așteptare.
        </p>
      </div>
    </div>
  );

  // FULL
  return (
    <div style={{ ...s.page, background: FOOD_BG }}>
      <FoodDecorations />
      <div style={s.card}>
        <div style={s.headerEmoji}>🍽️</div>
        <h1 style={s.title}>{info.name}</h1>
        <div style={{ ...s.banner, background: "#fef3c7", color: "#92400e" }}>🔴 Restaurantul este plin momentan</div>

        <div style={s.queueInfo}>
          <div style={s.qStat}>
            <span style={s.qNum}>{info.queueLength}</span>
            <span style={s.qLabel}>grupuri în coadă</span>
          </div>
          <div style={s.qDivider} />
          <div style={s.qStat}>
            <span style={s.qNum}>~{info.estimatedWaitMinutes}</span>
            <span style={s.qLabel}>Timp estimat</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Număr de persoane</label>
          <select value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} style={s.input} required>
            {Array.from({ length: info.maxPartySize ?? 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "persoană" : "persoane"}</option>
            ))}
          </select>

          <label style={s.label}>Telefon WhatsApp</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" style={s.input} required />

          <label style={s.label}>Nume (opțional)</label>
          <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Numele tău" style={s.input} />

          <label style={s.label}>Notă (opțional)</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex: scaun înalt, terasă..." style={s.input} maxLength={200} />

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" style={s.btn} disabled={submitting}>
            {submitting ? "Se înscrie..." : "Intră în coadă →"}
          </button>
        </form>

        <p style={s.muted}>Vei primi mesaj WhatsApp când masa ta este gata.</p>
      </div>
    </div>
  );
}

function FoodDecorations() {
  const items = ["🍕", "🍝", "🥗", "🍷", "🥩", "🍰", "🫕", "🥂"];
  const pos = [
    { top: "4%", left: "2%", size: 42, op: 0.13, rot: -15 },
    { top: "6%", right: "3%", size: 38, op: 0.11, rot: 20 },
    { top: "30%", left: "-1%", size: 32, op: 0.08, rot: 10 },
    { top: "65%", right: "0%", size: 36, op: 0.09, rot: -20 },
    { bottom: "8%", left: "4%", size: 34, op: 0.10, rot: 15 },
    { bottom: "4%", right: "3%", size: 40, op: 0.12, rot: -10 },
    { top: "48%", left: "0%", size: 28, op: 0.07, rot: 5 },
    { top: "52%", right: "1%", size: 30, op: 0.08, rot: -5 },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {pos.map((p, i) => (
        <div key={i} style={{ position: "absolute", fontSize: p.size, opacity: p.op, transform: `rotate(${p.rot}deg)`, top: p.top, right: (p as {right?: string}).right, bottom: p.bottom, left: p.left }}>
          {items[i % items.length]}
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "system-ui, sans-serif", position: "relative" },
  card: { background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)", borderRadius: "20px", padding: "32px 24px", width: "100%", maxWidth: "420px", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", position: "relative", zIndex: 1 },
  headerEmoji: { fontSize: 44, textAlign: "center" as const, marginBottom: 8 },
  title: { fontSize: "26px", fontWeight: 800, margin: "0 0 12px 0", textAlign: "center" as const, color: "#1a1a1a" },
  banner: { padding: "10px 16px", borderRadius: "10px", fontWeight: 700, fontSize: "15px", textAlign: "center" as const, marginBottom: "16px" },
  queueInfo: { display: "flex", alignItems: "center", background: "#fff8f0", border: "1.5px solid #fed7aa", borderRadius: "14px", padding: "18px", marginBottom: "20px" },
  qStat: { display: "flex", flexDirection: "column" as const, alignItems: "center", flex: 1 },
  qNum: { fontSize: "38px", fontWeight: 800, color: "#ea580c", lineHeight: 1 },
  qLabel: { fontSize: "12px", color: "#9a3412", marginTop: "4px", fontWeight: 600 },
  qDivider: { width: "1px", height: "50px", background: "#fed7aa", margin: "0 8px" },
  form: { display: "flex", flexDirection: "column" as const, gap: "4px", marginBottom: "12px" },
  label: { fontSize: "13px", fontWeight: 600, color: "#555", marginTop: "8px" },
  input: { padding: "12px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "16px", outline: "none", background: "#fafafa", marginBottom: "2px" },
  btn: { marginTop: "12px", padding: "15px", background: "linear-gradient(135deg, #ea580c, #dc2626)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(234,88,12,0.3)" },
  muted: { fontSize: "13px", color: "#9ca3af", textAlign: "center" as const, marginTop: "12px" },
  error: { color: "#dc2626", fontSize: "13px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "8px 12px" },
};
