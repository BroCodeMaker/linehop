"use client";

import { useRouter, usePathname } from "next/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

interface AdminNavProps {
  restaurantId: string;
  onSupport?: () => void;
  onErrorLog?: () => void;
}

export default function AdminNav({ restaurantId, onSupport, onErrorLog }: AdminNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const isDashboard = pathname?.includes("/dashboard");
  const isSettings = pathname?.includes("/settings");
  const isHistory = pathname?.includes("/history");
  const isStatistics = pathname?.includes("/statistics");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app/login");
  }

  return (
    <div style={s.header}>
      {/* Logo + back */}
      <div style={s.left}>
        <button
          onClick={() => router.push("/app")}
          style={s.backBtn}
          title={t("all_restaurants")}
        >
          {t("back_restaurants")}
        </button>
        <span style={s.logo}>LineHop</span>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <button
          onClick={() => router.push(`/app/${restaurantId}/dashboard`)}
          style={{
            ...s.tab,
            ...(isDashboard ? s.tabActive : {}),
          }}
        >
          📊 {t("nav_dashboard")}
        </button>
        <button
          onClick={() => router.push(`/app/${restaurantId}/settings`)}
          style={{
            ...s.tab,
            ...(isSettings ? s.tabActive : {}),
          }}
        >
          ⚙️ {t("nav_settings")}
        </button>
        <button
          onClick={() => router.push(`/app/${restaurantId}/history`)}
          style={{
            ...s.tab,
            ...(isHistory ? s.tabActive : {}),
          }}
        >
          📋 {t("nav_history")}
        </button>
        <button
          onClick={() => router.push(`/app/${restaurantId}/statistics`)}
          style={{
            ...s.tab,
            ...(isStatistics ? s.tabActive : {}),
          }}
        >
          📊 {t("nav_statistics")}
        </button>
        {onSupport && (
          <button onClick={onSupport} style={{ ...s.tab, color: "#92400e", background: "#fef3c7" }}>
            🆘 {t("nav_support")}
          </button>
        )}
        {onErrorLog && (
          <button onClick={onErrorLog} style={{ ...s.tab, color: "#0c4a6e", background: "#e0f2fe" }}>
            📋 {t("nav_error_log")}
          </button>
        )}
      </div>

      {/* Right actions */}
      <div style={s.right}>
        <LocaleSwitcher />
        <button onClick={handleLogout} style={s.logoutBtn}>{t("logout")}</button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    background: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #f0e8dc",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
    height: 56,
    gap: 12,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    flex: 1,
  },
  logo: {
    fontSize: 17,
    fontWeight: 800,
    color: "#1a1a1a",
    whiteSpace: "nowrap",
  },
  backBtn: {
    padding: "4px 10px",
    background: "transparent",
    color: "#9ca3af",
    border: "1.5px solid #e5e7eb",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  tabs: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#f3f4f6",
    borderRadius: 10,
    padding: "4px",
    flexShrink: 0,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  tab: {
    padding: "6px 18px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#6b7280",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  tabActive: {
    background: "#fff",
    color: "#111",
    boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
    justifyContent: "flex-end",
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
};
