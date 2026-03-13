"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminNav from "@/components/AdminNav";

const FOOD_BG = `radial-gradient(ellipse at 5% 0%, rgba(251,146,60,0.12) 0%, transparent 40%), radial-gradient(ellipse at 95% 100%, rgba(234,179,8,0.08) 0%, transparent 40%), #fdf6ee`;

type Period = "today" | "week" | "month" | "all";

type Statistics = {
  period: string;
  totalJoined: number;
  totalConfirmed: number;
  totalNoShows: number;
  totalSeated: number;
  totalPeopleSeated: number;
  avgWaitMinutes: number | null;
  calledFromList: number;
  addedManually: number;
  walkIns: number;
};

const PERIOD_LABELS: Record<Period, string> = {
  today: "Azi",
  week: "Ultima săptămână",
  month: "Ultima lună",
  all: "Tot timpul",
};

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "18px 20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#111", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function StatisticsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [period, setPeriod] = useState<Period>("today");
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/statistics?period=${period}`);
      const data = await res.json();
      if (data.ok) setStats(data);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: "100vh", background: FOOD_BG, fontFamily: "system-ui, sans-serif" }}>
      <AdminNav restaurantId={restaurantId} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>📊 Statistici</h1>
            <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 13 }}>
              {PERIOD_LABELS[period]}
            </p>
          </div>

          {/* Period filter */}
          <div style={{ display: "flex", gap: 6, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
            {(["today", "week", "month", "all"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  background: period === p ? "#fff" : "transparent",
                  color: period === p ? "#111" : "#6b7280",
                  boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Se încarcă...</div>
        ) : stats ? (
          <>
            {/* Primary metrics */}
            <div style={s.grid}>
              <StatCard
                label="Grupuri înscrise în coadă"
                value={stats.totalJoined}
                sub="Total intrări create"
                color="#3b82f6"
              />
              <StatCard
                label="Grupuri confirmate"
                value={stats.totalConfirmed}
                sub="Au confirmat prezența"
                color="#8b5cf6"
              />
              <StatCard
                label="No-show"
                value={stats.totalNoShows}
                sub="Confirm + Arrival expirat"
                color="#ef4444"
              />
              <StatCard
                label="Timp mediu așteptare"
                value={stats.avgWaitMinutes != null ? `${stats.avgWaitMinutes} min` : "—"}
                sub="Înscris → aşezat (fără walk-in)"
                color="#f59e0b"
              />
            </div>

            <div style={{ height: 16 }} />

            {/* Seating metrics */}
            <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#374151", marginBottom: 16 }}>🪑 Aşezare la masă</div>
              <div style={s.grid}>
                <StatCard
                  label="Grupuri aşezate"
                  value={stats.totalSeated}
                  sub="Status SEATED"
                  color="#10b981"
                />
                <StatCard
                  label="Total persoane aşezate"
                  value={stats.totalPeopleSeated}
                  sub="Suma partySize la SEATED"
                  color="#16a34a"
                />
              </div>
            </div>

            {/* Source metrics */}
            <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#374151", marginBottom: 16 }}>📋 Sursa grupurilor</div>
              <div style={s.grid}>
                <StatCard
                  label="Chemate din lista"
                  value={stats.calledFromList}
                  sub="Au primit WhatsApp call"
                  color="#ea580c"
                />
                <StatCard
                  label="Adăugate manual"
                  value={stats.addedManually}
                  sub="Adăugate de hostess"
                  color="#6366f1"
                />
                <StatCard
                  label="Walk-in"
                  value={stats.walkIns}
                  sub="Aşezate direct de hostess"
                  color="#0891b2"
                />
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Nu s-au putut încărca statisticile.</div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: 12,
  },
};
