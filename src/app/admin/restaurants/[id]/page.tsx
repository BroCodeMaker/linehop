"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  listClosed: boolean;
  createdAt: string;
  settings?: {
    confirmTimerSec: number;
    arrivalTimerSec: number;
    maxPartySize: number;
    maxQueueSize: number;
    waitMinutesPerGroup: number;
  } | null;
};

type Entry = {
  id: string;
  guestName?: string;
  partySize: number;
  phoneE164: string;
  status: string;
  createdAt: string;
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: "#16a34a",
  FULL: "#d97706",
  PAUSED: "#6b7280",
  CLOSED: "#dc2626",
};
const STATUS_BG: Record<string, string> = {
  OPEN: "#dcfce7",
  FULL: "#fef3c7",
  PAUSED: "#f3f4f6",
  CLOSED: "#fee2e2",
};

const ENTRY_BG: Record<string, string> = {
  WAITING: "#fff",
  CALLED: "#fff7ed",
  CONFIRMED: "#f0fdf4",
  NO_SHOW_CONFIRM: "#fee2e2",
  NO_SHOW_ARRIVAL: "#fff7ed",
  SEATED: "#f0f9ff",
  SKIPPED: "#fafafa",
};

export default function AdminRestaurantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const restaurantId = params.id;

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/restaurants/${restaurantId}`);
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setRestaurant(data);

      const entriesRes = await fetch(
        `/api/restaurants/${restaurantId}/entries?status=WAITING,CALLED,CONFIRMED`
      );
      if (entriesRes.ok) {
        const eData = await entriesRes.json();
        setEntries(Array.isArray(eData) ? eData : eData.entries ?? []);
      }

      // Generate QR code
      const publicUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/r/${data.slug}`
          : `/r/${data.slug}`;
      const url = await QRCode.toDataURL(publicUrl, { width: 200, margin: 2 });
      setQrDataUrl(url);

      setLoading(false);
    }
    load();
  }, [restaurantId, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#6b7280",
        }}
      >
        Se încarcă...
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
        Restaurant negăsit.
      </div>
    );
  }

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${restaurant.slug}`
      : `/r/${restaurant.slug}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        .admin-overview-card { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
        .admin-overview-info { flex: 1; min-width: 200px; }
        .admin-overview-qr { text-align: center; }
        .admin-entry-row { display: flex; align-items: center; gap: 16px; }
        .admin-entry-status { font-size: 11px; font-weight: 700; color: #6b7280; min-width: 90px; }
        .admin-entry-name { font-weight: 600; color: #111; flex: 1; }
        .admin-entry-meta { font-size: 13px; color: #6b7280; }
        .admin-entry-time { font-size: 12px; color: #9ca3af; }
        @media (max-width: 600px) {
          .admin-overview-card { flex-direction: column; gap: 20px; }
          .admin-overview-qr { width: 100%; display: flex; flex-direction: column; align-items: center; }
          .admin-overview-info { min-width: unset; width: 100%; }
          .admin-entry-row { flex-wrap: wrap; gap: 8px; }
          .admin-entry-status { min-width: unset; }
          .admin-overview-card a { font-size: 12px; padding: 7px 12px; }
        }
      `}</style>
      {/* Header */}
      <div
        style={{
          background: "#111827",
          color: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          height: 56,
        }}
      >
        <a
          href="/admin"
          style={{ color: "#9ca3af", textDecoration: "none", fontSize: 13 }}
        >
          ← Super Admin
        </a>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{restaurant.name}</span>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
        {/* Overview card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div className="admin-overview-card"><div className="admin-overview-info">
            <h2
              style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: "#111" }}
            >
              {restaurant.name}
            </h2>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>
              <div>
                Slug: <strong style={{ color: "#111" }}>{restaurant.slug}</strong>
              </div>
              <div>
                Status:{" "}
                <span
                  style={{
                    background: STATUS_BG[restaurant.status] ?? "#f3f4f6",
                    color: STATUS_COLOR[restaurant.status] ?? "#374151",
                    borderRadius: 20,
                    padding: "2px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {restaurant.status}
                </span>
              </div>
              <div>
                Creat:{" "}
                <strong style={{ color: "#111" }}>
                  {new Date(restaurant.createdAt).toLocaleDateString("ro-RO")}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={`/app/${restaurant.id}/dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#111827",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Dashboard restaurant ↗
              </a>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#f3f4f6",
                  color: "#111",
                  padding: "8px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Pagină publică ↗
              </a>
            </div>
          </div>

          {/* QR Code */}
          <div className="admin-overview-qr">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                style={{ width: 160, height: 160, borderRadius: 8 }}
              />
            ) : (
              <canvas ref={canvasRef} />
            )}
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
              {publicUrl}
            </div>
          </div>
          </div>{/* end admin-overview-card */}
        </div>

        {/* Settings card */}
        {restaurant.settings && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              padding: 24,
              marginBottom: 20,
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
              Configurații
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {[
                ["Timer confirmare", `${restaurant.settings.confirmTimerSec}s`],
                ["Timer sosire", `${restaurant.settings.arrivalTimerSec}s`],
                ["Mărime max. grup", `${restaurant.settings.maxPartySize} pers.`],
                ["Capacitate coadă", `${restaurant.settings.maxQueueSize}`],
                ["Min. așteptare/grup", `${restaurant.settings.waitMinutesPerGroup} min`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: "#f9fafb",
                    borderRadius: 8,
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active entries */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            padding: 24,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
            Entries active ({entries.length})
          </h3>
          {entries.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              Niciun entry activ.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.map((e) => (
                <div
                  key={e.id}
                  style={{
                    background: ENTRY_BG[e.status] ?? "#f9fafb",
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      minWidth: 90,
                    }}
                  >
                    {e.status}
                  </span>
                  <span style={{ fontWeight: 600, color: "#111", flex: 1 }}>
                    {e.guestName || "—"}
                  </span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {e.partySize} pers.
                  </span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {new Date(e.createdAt).toLocaleTimeString("ro-RO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
