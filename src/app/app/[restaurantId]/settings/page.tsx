"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminNav from "@/components/AdminNav";

const FOOD_BG = `radial-gradient(ellipse at 5% 0%, rgba(251,146,60,0.12) 0%, transparent 40%), radial-gradient(ellipse at 95% 100%, rgba(234,179,8,0.08) 0%, transparent 40%), #fdf6ee`;

type Settings = {
  confirmTimerSec: number;
  arrivalTimerSec: number;
  bufferVisibilitySec: number;
  maxCallAgain: number;
  maxPartySize: number;
  maxQueueSize: number;
  waitMinutesPerGroup: number;
  estimatedTableTimeMin: number;
  useCalculatedAvgTime: boolean;
  msgWhatsappCall: string;
  msgWhatsappExpire: string;
  msgWhatsappCallAgain: string;
};

export default function SettingsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [form, setForm] = useState<Settings>({
    confirmTimerSec: 120,
    arrivalTimerSec: 300,
    bufferVisibilitySec: 600,
    maxCallAgain: 1,
    maxPartySize: 10,
    maxQueueSize: 50,
    waitMinutesPerGroup: 10,
    estimatedTableTimeMin: 15,
    useCalculatedAvgTime: false,
    msgWhatsappCall: "Vă rugăm să vă prezentați la intrare în 2 minute.",
    msgWhatsappExpire: "Din păcate locul dumneavoastră a expirat.",
    msgWhatsappCallAgain: "Vă mai acordăm o șansă, vă rugăm să vă prezentați.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [calculatedAvgMin, setCalculatedAvgMin] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}/settings`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setForm(d.settings);
      })
      .finally(() => setLoading(false));

    // Fetch calculated avg wait time (all-time)
    fetch(`/api/restaurants/${restaurantId}/statistics?period=all`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.avgWaitMinutes != null) setCalculatedAvgMin(d.avgWaitMinutes);
      })
      .catch(() => {});
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
    let num = Number(val);
    // Cap maxQueueSize at 50
    if (field === "maxQueueSize" && num > 50) num = 50;
    setForm(f => ({ ...f, [field]: num }));
  }

  function setStr(field: keyof Settings, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }

  return (
    <div style={{ minHeight: "100vh", background: FOOD_BG, fontFamily: "system-ui, sans-serif" }}>
      {/* Nav */}
      <AdminNav restaurantId={restaurantId} />

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
                  <label style={s.label}>Max coadă (max 50)</label>
                  <p style={s.hint}>Numărul maxim de grupuri în coadă simultan (limitat la 50)</p>
                  <input type="number" min={5} max={50} value={form.maxQueueSize} onChange={e => setNum("maxQueueSize", e.target.value)} style={s.input} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Minute estimate per grup</label>
                  <p style={s.hint}>Timp estimat de așteptare per grup (minute). Afișat clienților.</p>
                  <input type="number" min={1} max={120} value={form.waitMinutesPerGroup} onChange={e => setNum("waitMinutesPerGroup", e.target.value)} style={s.input} required />
                </div>
              </div>
            </div>

            {/* Table turnover section */}
            <div style={s.card}>
              <div style={s.sectionTitle}>🪑 Timp ocupare masă</div>
              <div style={s.field}>
                <label style={s.label}>Timp estimat per masă (minute)</label>
                <p style={s.hint}>Estimarea dumneavoastră manuală pentru cât timp stă un grup la masă</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={form.estimatedTableTimeMin}
                    onChange={e => setNum("estimatedTableTimeMin", e.target.value)}
                    style={{ ...s.input, width: 100, opacity: form.useCalculatedAvgTime ? 0.4 : 1 }}
                    disabled={form.useCalculatedAvgTime}
                    required={!form.useCalculatedAvgTime}
                  />
                  {calculatedAvgMin != null ? (
                    <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, background: "#f0fdf4", padding: "4px 10px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                      ✅ calculat: {calculatedAvgMin} min
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>
                      (calculat: insuficient date)
                    </span>
                  )}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={form.useCalculatedAvgTime}
                    onChange={e => setForm(f => ({ ...f, useCalculatedAvgTime: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#16a34a" }}
                  />
                  Folosește media calculată automat
                  {form.useCalculatedAvgTime && calculatedAvgMin != null && (
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 400, marginLeft: 4 }}>
                      ({calculatedAvgMin} min)
                    </span>
                  )}
                  {form.useCalculatedAvgTime && calculatedAvgMin == null && (
                    <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 400, marginLeft: 4 }}>
                      (insuficient date — se folosește valoarea manuală)
                    </span>
                  )}
                </label>
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
