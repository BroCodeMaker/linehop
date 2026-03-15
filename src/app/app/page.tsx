"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

const FOOD_BG = `radial-gradient(ellipse at 5% 0%, rgba(251,146,60,0.12) 0%, transparent 40%),
  radial-gradient(ellipse at 95% 100%, rgba(234,179,8,0.08) 0%, transparent 40%), #fdf6ee`;

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[îí]/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AppIndexPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", slug: "", address: "" });
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetch("/api/restaurants")
      .then(r => {
        if (r.status === 401) {
          router.push("/app/login");
          return null;
        }
        return r.json();
      })
      .then(d => {
        if (d?.ok) setRestaurants(d.restaurants);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app/login");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          slug: createForm.slug || toSlug(createForm.name),
          address: createForm.address || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Error creating restaurant");
        return;
      }
      router.push(`/app/${data.restaurant.id}/dashboard`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: FOOD_BG, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.logo}>{t("app_title")}</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <LocaleSwitcher />
          <button onClick={() => setShowCreate(v => !v)} style={s.createBtn}>
            {t("app_new_restaurant")}
          </button>
          <button onClick={handleLogout} style={s.logoutBtn}>{t("logout")}</button>
        </div>
      </div>

      <div style={s.body}>
        <h1 style={s.pageTitle}>{t("app_your_restaurants")}</h1>

        {/* Create form */}
        {showCreate && (
          <div style={s.createCard}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#374151", marginBottom: 16 }}>
              {t("app_add_restaurant")}
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={s.fieldGroup}>
                <label style={s.label}>{t("app_restaurant_name")}</label>
                <input
                  required
                  value={createForm.name}
                  onChange={e => {
                    const name = e.target.value;
                    setCreateForm(f => ({ ...f, name, slug: toSlug(name) }));
                  }}
                  placeholder={t("app_restaurant_name_placeholder")}
                  style={s.input}
                />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>{t("app_slug")}</label>
                <input
                  value={createForm.slug}
                  onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  placeholder={t("app_slug_placeholder")}
                  style={s.input}
                />
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  {t("app_clients_access")}{createForm.slug || "slug-restaurant"}
                </span>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>{t("app_address")}</label>
                <input
                  value={createForm.address}
                  onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))}
                  placeholder={t("app_address_placeholder")}
                  style={s.input}
                />
              </div>
              {createError && (
                <div style={{ color: "#dc2626", fontSize: 13, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>
                  ❌ {createError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(""); }} style={s.cancelBtn}>
                  {t("cancel")}
                </button>
                <button type="submit" disabled={creating} style={s.submitBtn}>
                  {creating ? t("app_creating") : t("app_create")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Restaurant list */}
        {loading ? (
          <div style={s.emptyState}>{t("loading")}</div>
        ) : restaurants.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🏪</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
              {t("app_no_restaurants")}
            </p>
            <p style={{ color: "#9ca3af", marginBottom: 20 }}>
              {t("app_no_restaurants_sub")}
            </p>
            <button onClick={() => setShowCreate(true)} style={s.submitBtn}>
              {t("app_add_first")}
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {restaurants.map(r => {
              const statusBg = ({ OPEN: "#dcfce7", FULL: "#fed7aa", PAUSED: "#fef3c7", CLOSED: "#f3f4f6" } as Record<string, string>)[r.status] ?? "#f3f4f6";
              const statusColor = ({ OPEN: "#15803d", FULL: "#9a3412", PAUSED: "#92400e", CLOSED: "#6b7280" } as Record<string, string>)[r.status] ?? "#6b7280";
              return (
                <button
                  key={r.id}
                  onClick={() => router.push(`/app/${r.id}/dashboard`)}
                  style={s.restaurantCard}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontSize: 32 }}>🍽️</span>
                    <span style={{ ...s.statusBadge, background: statusBg, color: statusColor }}>
                      {t(`restStatus_${r.status}`) || r.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#111", marginBottom: 4, textAlign: "left" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "left" }}>
                    /r/{r.slug}
                  </div>
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 700 }}>
                      {t("app_open_dashboard")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #f0e8dc",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  logo: { fontSize: 18, fontWeight: 800, color: "#1a1a1a" },
  createBtn: {
    padding: "8px 16px",
    background: "#ea580c",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
  logoutBtn: {
    padding: "6px 14px",
    background: "transparent",
    color: "#9ca3af",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  body: { padding: "24px 20px", maxWidth: 1000, margin: "0 auto" },
  pageTitle: { fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 20 },
  createCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: "20px 24px",
    marginBottom: 20,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    border: "2px solid #fed7aa",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 13, fontWeight: 700, color: "#374151" },
  input: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    outline: "none",
  },
  submitBtn: {
    padding: "10px 22px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  cancelBtn: {
    padding: "10px 18px",
    background: "transparent",
    color: "#9ca3af",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
  },
  restaurantCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: "20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "2px solid #f0e8dc",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    textAlign: "left",
    width: "100%",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 999,
    display: "inline-block",
  },
  emptyState: {
    textAlign: "center",
    padding: "64px 0",
    color: "#9ca3af",
    fontSize: 16,
  },
};
