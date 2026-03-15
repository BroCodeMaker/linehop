"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  entriesToday: number;
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

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setRestaurants(data);
      })
      .catch(() => setError("Eroare la încărcare"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#111827",
          color: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18 }}>
          🔐 LineHop Super Admin
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a
            href="/admin/qr-tokens"
            style={{
              color: "#d1d5db",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            QR Tokens
          </a>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid #4b5563",
              color: "#d1d5db",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Deconectare
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111" }}>
            Restaurante ({restaurants.length})
          </h1>
          <a
            href="/admin/qr-tokens"
            style={{
              background: "#111827",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Gestionează QR Tokens
          </a>
        </div>

        {loading && (
          <div style={{ color: "#6b7280", textAlign: "center", padding: 48 }}>
            Se încarcă...
          </div>
        )}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              borderRadius: 8,
              padding: 16,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && restaurants.length === 0 && (
          <div style={{ color: "#6b7280", textAlign: "center", padding: 48 }}>
            Niciun restaurant găsit.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {restaurants.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{ fontSize: 17, fontWeight: 700, color: "#111" }}
                  >
                    {r.name}
                  </span>
                  <span
                    style={{
                      background: STATUS_BG[r.status] ?? "#f3f4f6",
                      color: STATUS_COLOR[r.status] ?? "#374151",
                      borderRadius: 20,
                      padding: "2px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  <span style={{ marginRight: 16 }}>
                    Slug: <strong>{r.slug}</strong>
                  </span>
                  <span style={{ marginRight: 16 }}>
                    Entries azi: <strong>{r.entriesToday}</strong>
                  </span>
                  <span>
                    Creat:{" "}
                    {new Date(r.createdAt).toLocaleDateString("ro-RO")}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={`/admin/restaurants/${r.id}`}
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
                  Detalii
                </a>
                <a
                  href={`/app/${r.id}/dashboard`}
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
                  Intră în restaurant ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
