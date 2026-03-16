"use client";

import Link from "next/link";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", fontFamily: "sans-serif", color: "#111827" }}>
      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(255,255,255,0.95)", borderBottom: "1px solid #f3f4f6", backdropFilter: "blur(4px)" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f97316", letterSpacing: "-0.025em" }}>LineHop</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <LocaleSwitcher />
            <Link
              href="/app/login"
              style={{ backgroundColor: "#111827", color: "#ffffff", fontWeight: 700, fontSize: "0.875rem", padding: "0.625rem 1.25rem", borderRadius: "0.75rem", textDecoration: "none", display: "inline-block" }}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <section style={{ maxWidth: "56rem", margin: "0 auto", padding: "6rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#fff7ed", color: "#ea580c", fontSize: "0.875rem", fontWeight: 600, padding: "0.5rem 1rem", borderRadius: "9999px", marginBottom: "2rem" }}>
          {t("landing_badge")}
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", fontWeight: 900, color: "#111827", lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: "1.5rem" }}>
          {t("landing_hero_title1")}{" "}
          <span style={{ color: "#f97316" }}>{t("landing_hero_title2")}</span>
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#6b7280", maxWidth: "40rem", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
          {t("landing_hero_sub")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
          <a
            href="mailto:contact@linehop.ro"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", backgroundColor: "#f97316", color: "#ffffff", fontWeight: 700, fontSize: "1.125rem", padding: "1rem 2rem", borderRadius: "1rem", textDecoration: "none", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}
          >
            {t("landing_demo_btn")}
          </a>
          <Link
            href="/app/login"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", backgroundColor: "#ffffff", color: "#111827", fontWeight: 700, fontSize: "1.125rem", padding: "1rem 2rem", borderRadius: "1rem", border: "2px solid #e5e7eb", textDecoration: "none" }}
          >
            {t("landing_enter_dashboard")}
          </Link>
        </div>
      </section>

      {/* SECTION 2 — CUM FUNCȚIONEAZĂ */}
      <section style={{ backgroundColor: "#f9fafb", padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "1rem" }}>
            {t("landing_how_title")}
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "3.5rem", fontSize: "1.125rem" }}>{t("landing_how_sub")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
            {/* Step 1 */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", flex: "1 1 280px", maxWidth: "340px" }}>
              <div style={{ width: "4rem", height: "4rem", backgroundColor: "#fff7ed", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.875rem" }}>
                📷
              </div>
              <span style={{ backgroundColor: "#fff7ed", color: "#c2410c", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>{t("landing_step1_label")}</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: 0 }}>{t("landing_step1_title")}</h3>
              <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                {t("landing_step1_desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", flex: "1 1 280px", maxWidth: "340px" }}>
              <div style={{ width: "4rem", height: "4rem", backgroundColor: "#eff6ff", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.875rem" }}>
                📊
              </div>
              <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>{t("landing_step2_label")}</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: 0 }}>{t("landing_step2_title")}</h3>
              <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                {t("landing_step2_desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", flex: "1 1 280px", maxWidth: "340px" }}>
              <div style={{ width: "4rem", height: "4rem", backgroundColor: "#f0fdf4", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.875rem" }}>
                🔔
              </div>
              <span style={{ backgroundColor: "#f0fdf4", color: "#15803d", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>{t("landing_step3_label")}</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: 0 }}>{t("landing_step3_title")}</h3>
              <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                {t("landing_step3_desc")}
              </p>
            </div>
          </div>
          <p style={{ textAlign: "center", color: "#9ca3af", fontStyle: "italic", marginTop: "2.5rem", fontSize: "1rem" }}>
            {t("landing_less_chaos")}
          </p>
        </div>
      </section>

      {/* SECTION 3 — BENEFICII RESTAURANT */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "3.5rem" }}>
            {t("landing_benefits_title")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem 3rem" }}>
            {([
              { icon: "🪑", titleKey: "landing_benefit1_title", descKey: "landing_benefit1_desc" },
              { icon: "📋", titleKey: "landing_benefit2_title", descKey: "landing_benefit2_desc" },
              { icon: "😊", titleKey: "landing_benefit3_title", descKey: "landing_benefit3_desc" },
              { icon: "❓", titleKey: "landing_benefit4_title", descKey: "landing_benefit4_desc" },
              { icon: "🏃", titleKey: "landing_benefit5_title", descKey: "landing_benefit5_desc" },
            ] as const).map(({ icon, titleKey, descKey }) => (
              <div key={titleKey} style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <span style={{ fontSize: "1.5rem", flexShrink: 0, marginTop: "0.125rem", opacity: 0.75 }}>{icon}</span>
                <div>
                  <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "#111827", fontSize: "1rem", lineHeight: 1.4 }}>{t(titleKey)}</p>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", color: "#9ca3af", fontStyle: "italic", marginTop: "3rem", fontSize: "1rem" }}>
            {t("landing_benefits_sub")}
          </p>
        </div>
      </section>

      {/* SECTION 4 — BENEFICII CLIENȚI */}
      <section style={{ backgroundColor: "#f9fafb", padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "3.5rem" }}>
            {t("landing_clients_title")}
          </h2>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {([
              ["🚶", "landing_client1"],
              ["🗺️", "landing_client2"],
              ["📊", "landing_client3"],
              ["📱", "landing_client4"],
            ] as const).map(([icon, key]) => (
              <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: "0.125rem" }}>{icon}</span>
                <span style={{ color: "#374151", fontSize: "1rem", lineHeight: 1.6 }}>{t(key)}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", color: "#9ca3af", marginTop: "2rem", fontSize: "1rem" }}>
            {t("landing_clients_sub")}
          </p>
        </div>
      </section>

      {/* SECTION 5 — DEMO VIZUAL */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "3.5rem" }}>
            {t("landing_practice_title")}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem", alignItems: "flex-start", justifyContent: "center" }}>
            {/* Dashboard mockup */}
            <div style={{ flex: "1 1 320px", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#374151", textAlign: "center" }}>
                {t("landing_dashboard_view")}
              </h3>
              <div style={{ backgroundColor: "#f3f4f6", borderRadius: "1.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb", padding: "2rem", minHeight: "16rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dashboard LineHop</span>
                  <span style={{ backgroundColor: "#dcfce7", color: "#15803d", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>OPEN</span>
                </div>
                {[
                  { name: "Andrei P.", time: "18 min", pos: 1, status: "CALLED" },
                  { name: "Maria I.", time: "32 min", pos: 2, status: "WAITING" },
                  { name: "Radu C.", time: "12 min", pos: 3, status: "WAITING" },
                ].map((entry) => (
                  <div key={entry.name} style={{ backgroundColor: "#ffffff", borderRadius: "0.75rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ width: "1.75rem", height: "1.75rem", backgroundColor: "#fff7ed", color: "#ea580c", fontSize: "0.75rem", fontWeight: 700, borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {entry.pos}
                      </span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>{entry.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{entry.time}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.125rem 0.5rem", borderRadius: "9999px", backgroundColor: entry.status === "CALLED" ? "#dbeafe" : "#f3f4f6", color: entry.status === "CALLED" ? "#1d4ed8" : "#4b5563" }}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div style={{ flex: "1 1 200px", maxWidth: "280px", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#374151", textAlign: "center" }}>
                {t("landing_client_view")}
              </h3>
              <div style={{ width: "14rem", backgroundColor: "#111827", borderRadius: "2.5rem", padding: "0.75rem", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
                <div style={{ backgroundColor: "#ffffff", borderRadius: "2rem", overflow: "hidden" }}>
                  <div style={{ backgroundColor: "#f97316", padding: "1.5rem 1rem 1.25rem", textAlign: "center" }}>
                    <p style={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: 600, opacity: 0.8, margin: "0 0 0.25rem" }}>LineHop</p>
                    <p style={{ color: "#ffffff", fontSize: "1.125rem", fontWeight: 900, margin: 0 }}>Restaurant Bella</p>
                  </div>
                  <div style={{ padding: "1.25rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "4rem", height: "4rem", backgroundColor: "#fff7ed", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "1.875rem", fontWeight: 900, color: "#f97316", lineHeight: 1 }}>2</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center", lineHeight: 1.4, margin: 0 }}>{t("landing_queue_position")}</p>
                    <div style={{ backgroundColor: "#f9fafb", borderRadius: "0.75rem", padding: "0.75rem 1rem", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
                      <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 0.25rem" }}>{t("landing_estimated_time_label")}</p>
                      <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#111827", margin: 0 }}>~15 min</p>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", lineHeight: 1.4, margin: 0 }}>
                      {t("landing_whatsapp_notify")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA FINAL */}
      <section style={{ backgroundColor: "#f97316", padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, color: "#ffffff", marginBottom: "1rem", lineHeight: 1.25 }}>
            {t("landing_cta_title")}
          </h2>
          <p style={{ color: "#ffedd5", fontSize: "1.25rem", marginBottom: "2.5rem" }}>{t("landing_cta_sub")}</p>
          <Link
            href="/app/login"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", backgroundColor: "#ffffff", color: "#ea580c", fontWeight: 900, fontSize: "1.125rem", padding: "1rem 2.5rem", borderRadius: "1rem", textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
          >
            {t("landing_cta_btn")}
          </Link>
        </div>
      </section>

      {/* SECTION 7 — CONTACT */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "32rem", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.875rem", fontWeight: 900, color: "#111827", marginBottom: "0.75rem" }}>{t("landing_contact_title")}</h2>
          <p style={{ color: "#6b7280", fontSize: "1.125rem", marginBottom: "2.5rem" }}>{t("landing_contact_sub")}</p>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6", borderRadius: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "2.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <a
              href="tel:0750198891"
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#111827", fontWeight: 600, fontSize: "1.125rem", textDecoration: "none" }}
            >
              <span style={{ fontSize: "1.5rem" }}>📞</span> 0750 198 891
            </a>
            <a
              href="mailto:contact@linehop.ro"
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#f97316", fontWeight: 600, fontSize: "1.125rem", textDecoration: "none" }}
            >
              <span style={{ fontSize: "1.5rem" }}>✉️</span> contact@linehop.ro
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FOOTER */}
      <footer style={{ borderTop: "1px solid #f3f4f6", padding: "1.5rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem", marginTop: "auto" }}>
        {t("footer")} · contact@linehop.ro
      </footer>
    </div>
  );
}
