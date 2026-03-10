"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const FOOD_BG = `radial-gradient(ellipse at 5% 0%, rgba(251,146,60,0.12) 0%, transparent 40%), radial-gradient(ellipse at 95% 100%, rgba(234,179,8,0.08) 0%, transparent 40%), #fdf6ee`;

type Settings = {
  confirmTimerSec: number;
  arrivalTimerSec: number;
  bufferVisibilitySec: number;
  maxCallAgain: number;
  maxPartySize: number;
  maxQueueSize: number;
  msgWhatsappCall: string;
  msgWhatsappExpire: string;
  msgWhatsappCallAgain: string;
};

export default function SettingsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Settings>({
    confirmTimerSec: 120,
    arrivalTimerSec: 300,
    bufferVisibilitySec: 600,
    maxCallAgain: 1,
    maxPartySize: 10,
    maxQueueSize: 50,
    msgWhatsappCall: "Vă rugăm să vă prezentați la intrare în 2 minute.",
    msgWhatsappExpire: "Din păcate locul dumneavoastră a expirat.",
    msgWhatsappCallAgain: "Vă mai acordăm o șansă, vă rugăm să vă prezentați.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}/settings`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setForm(d.settings);
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSuccess(true);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  function setNum(field: keyof Settings, val: string) {
    setForm(f => ({ ...f, [field]: Number(val) }));
  }

  function setStr(field: keyof Settings, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }

  return (
    <div style={{ minHeight: "100vh", background: FOOD_BG, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button onClick={() => router.push(`/app/${restaurantId}/dashboard`)} style={s.backBtn}>
            ← Dashboard
          </button>
          <span style={s.logo}>⚙️ Setări Restaurant</span>
        </div>
      </div>

      <div style={s.body}>
        {loading ? (
          <p style={s.muted}>Se încarcă...</p>
        ) : (
          <form onSubmit={handleSave}>
            {/* Timers section */}
            <div style={s.card}>
              <div style={s.sectionTitle}>⏱ Timere</div>
              <div style={s.grid}>
                <div style={s.field}>
                  <label style={s.label}>Confirmare (secunde)</label>
                  <p style={s.hint}>Timp acordat clientului chemat să confirme prezența</p>
                  <input type="number" min={30} max={600} value={form.confirmTimerSec} onChange={e => setNum("confirmTimerSec", e.target.value)} style={s.input} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Sosire (secunde)</label>
                  <p style={s.hint}>Timp acordat clientului confirmat să ajungă la intrare</p>
                  <input type="number" min={60} max={1800} value={form.arrivalTimerSec} onChange={e => setNum("arrivalTimerSec", e.target.value)} style={s.input} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Vizibilitate buffer (secunde)</label>
                  <p style={s.hint}>Cât timp rămân vizibile intrările NO_SHOW în dashboard</p>
                  <input type="number" min={60} max={3600} value={form.bufferVisibilitySec} onChange={e => setNum("bufferVisibilitySec", e.target.value)} style={s.input} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Max Call Again</label>
                  <p style={s.hint}>Numărul maxim de rechemări permise per client</p>
                  <input type="number" min={0} max={5} value={form.maxCallAgain} onChange={e => setNum("maxCallAgain", e.target.value)} style={s.input} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Max mărime grup</label>
                  <p style={s.hint}>Numărul maxim de persoane per rezervare</p>
                  <input type="number" min={1} max={50} value={form.maxPartySize} onChange={e => setNum("maxPartySize", e.target.value)} style={s.input} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Max coadă</label>
                  <p style={s.hint}>Numărul maxim de grupuri în coadă simultan</p>
                  <input type="number" min={5} max={500} value={form.maxQueueSize} onChange={e => setNum("maxQueueSize", e.target.value)} style={s.input} required />
                </div>
              </div>
            </div>

            {/* WhatsApp messages section */}
            <div style={s.card}>
              <div style={s.sectionTitle}>💬 Mesaje WhatsApp</div>
              <div style={s.fieldFull}>
                <label style={s.label}>Mesaj chemare</label>
                <p style={s.hint}>Trimis când clientul este chemat la intrare</p>
                <textarea value={form.msgWhatsappCall} onChange={e => setStr("msgWhatsappCall", e.target.value)} style={s.textarea} rows={3} required />
              </div>
              <div style={s.fieldFull}>
                <label style={s.label}>Mesaj expirare</label>
                <p style={s.hint}>Trimis când locul clientului a expirat (NO_SHOW)</p>
                <textarea value={form.msgWhatsappExpire} onChange={e => setStr("msgWhatsappExpire", e.target.value)} style={s.textarea} rows={3} required />
              </div>
              <div style={s.fieldFull}>
                <label style={s.label}>Mesaj rechemarare</label>
                <p style={s.hint}>Trimis la Call Again (a doua șansă)</p>
                <textarea value={form.msgWhatsappCallAgain} onChange={e => setStr("msgWhatsappCallAgain", e.target.value)} style={s.textarea} rows={3} required />
              </div>
            </div>

            {success && (
              <div style={s.successMsg}>✅ Setările au fost salvate cu succes!</div>
            )}

            <button type="submit" disabled={saving} style={s.saveBtn}>
              {saving ? "Se salvează..." : "💾 Salvează Setările"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #f0e8dc", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: "18px", fontWeight: 800, color: "#1a1a1a" },
  backBtn: { padding: "6px 14px", background: "transparent", color: "#6b7280", border: "1.5px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 },
  body: { padding: "20px 16px", maxWidth: 800, margin: "0 auto" },
  card: { background: "rgba(255,255,255,0.95)", borderRadius: "16px", padding: "20px 24px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  sectionTitle: { fontSize: "15px", fontWeight: 800, color: "#374151", marginBottom: "16px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" },
  field: { display: "flex", flexDirection: "column" as const, gap: 4 },
  fieldFull: { display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 16 },
  label: { fontSize: "13px", fontWeight: 700, color: "#374151" },
  hint: { fontSize: "11px", color: "#9ca3af", margin: "0 0 4px 0" },
  input: { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" as const },
  textarea: { padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" as const, resize: "vertical" as const, fontFamily: "system-ui, sans-serif" },
  saveBtn: { padding: "14px 32px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(22,163,74,0.25)", width: "100%" },
  successMsg: { background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "#166534" },
  muted: { color: "#9ca3af", padding: "32px 0", textAlign: "center" as const },
};
