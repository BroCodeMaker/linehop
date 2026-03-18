"use client";

import Link from "next/link";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

export default function HomePage() {
  const { t } = useTranslation();

  const problemCards = [
    { emoji: "🗣️", title: t("landing_problem1_title"), desc: t("landing_problem1_desc") },
    { emoji: "📋", title: t("landing_problem2_title"), desc: t("landing_problem2_desc") },
    { emoji: "👩‍💼", title: t("landing_problem3_title"), desc: t("landing_problem3_desc") },
    { emoji: "🪑", title: t("landing_problem4_title"), desc: t("landing_problem4_desc") },
  ];

  const steps = [
    { n: "1", title: t("landing_step1_title"), desc: t("landing_step1_desc") },
    { n: "2", title: t("landing_step2_title"), desc: t("landing_step2_desc") },
    { n: "3", title: t("landing_step3_title"), desc: t("landing_step3_desc") },
    { n: "4", title: t("landing_step4_title"), desc: t("landing_step4_desc") },
  ];

  const benefits = [
    { emoji: "📈", title: t("landing_benefit1_title"), desc: t("landing_benefit1_desc") },
    { emoji: "📋", title: t("landing_benefit2_title"), desc: t("landing_benefit2_desc") },
    { emoji: "👩‍💼", title: t("landing_benefit3_title"), desc: t("landing_benefit3_desc") },
    { emoji: "⏱️", title: t("landing_benefit4_title"), desc: t("landing_benefit4_desc") },
    { emoji: "😌", title: t("landing_benefit5_title"), desc: t("landing_benefit5_desc") },
    { emoji: "🔄", title: t("landing_benefit6_title"), desc: t("landing_benefit6_desc") },
  ];

  const stats = [
    { emoji: "📊", label: t("landing_stat1_label") },
    { emoji: "⏰", label: t("landing_stat2_label") },
    { emoji: "👥", label: t("landing_stat3_label") },
    { emoji: "❌", label: t("landing_stat4_label") },
  ];

  const forItems = [
    { emoji: "🍽️", label: t("landing_for1_label") },
    { emoji: "☕", label: t("landing_for2_label") },
    { emoji: "🌮", label: t("landing_for3_label") },
    { emoji: "☀️", label: t("landing_for4_label") },
    { emoji: "🚫", label: t("landing_for5_label") },
    { emoji: "🪑", label: t("landing_for6_label") },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", fontFamily: "'Inter', sans-serif", color: "#111827" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(255,255,255,0.97)", borderBottom: "1px solid #f3f4f6", backdropFilter: "blur(8px)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: "75rem", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "1.625rem", fontWeight: 900, color: "#E87722", letterSpacing: "-0.03em" }}>LineHop</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <LocaleSwitcher />
            <Link href="/app/login" style={{ backgroundColor: "#E87722", color: "#ffffff", fontWeight: 700, fontSize: "0.9rem", padding: "0.6rem 1.25rem", borderRadius: "0.75rem", textDecoration: "none" }}>
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: "80rem", margin: "0 auto", padding: "5rem 1.5rem", display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "center", justifyContent: "center" }}>
        <div style={{ flex: "1 1 400px", maxWidth: "560px" }}>
          <h1 style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 900, color: "#111827", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>
            {t("landing_hero_main1")}{" "}
            <span style={{ color: "#E87722" }}>{t("landing_hero_main2")}</span>
          </h1>
          <p style={{ fontSize: "1.15rem", color: "#6b7280", lineHeight: 1.7, marginBottom: "2rem" }}>
            {t("landing_hero_subtitle")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem" }}>
            <Link href="/demo" style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#E87722", color: "#fff", fontWeight: 700, fontSize: "1.05rem", padding: "0.9rem 1.875rem", borderRadius: "1rem", textDecoration: "none", boxShadow: "0 4px 18px rgba(232,119,34,0.4)" }}>
              {t("landing_try_free_30")}
            </Link>
            <Link href="/app/login" style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#fff", color: "#374151", fontWeight: 700, fontSize: "1.05rem", padding: "0.9rem 1.875rem", borderRadius: "1rem", border: "2px solid #e5e7eb", textDecoration: "none" }}>
              {t("landing_enter_dashboard")}
            </Link>
          </div>
        </div>

        {/* Mobile Card Mockup */}
        <div style={{ flex: "0 1 280px" }}>
          <div style={{ backgroundColor: "#111827", borderRadius: "2.5rem", padding: "0.875rem", boxShadow: "0 30px 60px rgba(0,0,0,0.22)", maxWidth: "260px", margin: "0 auto" }}>
            <div style={{ backgroundColor: "#fff", borderRadius: "2rem", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg, #E87722, #d96a18)", padding: "1.5rem 1.25rem 1.25rem", textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem", fontWeight: 600, margin: "0 0 0.2rem" }}>LineHop</p>
                <p style={{ color: "#fff", fontSize: "1rem", fontWeight: 800, margin: 0 }}>Restaurant Bella</p>
              </div>
              <div style={{ padding: "1.5rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem", textAlign: "center" }}>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <div style={{ flex: 1, background: "#fff8f2", borderRadius: "0.875rem", padding: "0.875rem" }}>
                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", margin: "0 0 0.2rem" }}>{t("landing_step2_label")}</p>
                    <p style={{ fontSize: "2.25rem", fontWeight: 900, color: "#E87722", margin: 0, lineHeight: 1 }}>3</p>
                  </div>
                  <div style={{ flex: 1, background: "#f9fafb", borderRadius: "0.875rem", padding: "0.875rem" }}>
                    <p style={{ fontSize: "0.65rem", color: "#9ca3af", margin: "0 0 0.2rem" }}>{t("join_estimated_wait")}</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: 0 }}>12 min</p>
                  </div>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: "0.875rem", padding: "0.75rem", border: "1.5px solid #bbf7d0" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#166534", margin: 0 }}>✅ {t("status_badge_CALLED")}</p>
                </div>
                <p style={{ fontSize: "0.7rem", color: "#9ca3af", margin: 0 }}>📱 {t("status_whatsapp_sent")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Problema restaurantelor aglomerate */}
      <section style={{ backgroundColor: "#fafafa", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "0.75rem" }}>
            {t("landing_problem_title")}
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "1.1rem", marginBottom: "3rem" }}>
            {t("landing_problem_sub")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {problemCards.map((item, i) => (
              <div key={i} style={{ backgroundColor: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.875rem" }}>{item.emoji}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem", lineHeight: 1.4 }}>{item.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", color: "#ef4444", fontWeight: 700, fontSize: "1.05rem", marginTop: "2.5rem" }}>
            {t("landing_problem_footer")}
          </p>
        </div>
      </section>

      {/* SECTION 3 — Cum funcționează */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "3.5rem" }}>
            {t("landing_how_title")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem" }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem" }}>
                <div style={{ width: "4.5rem", height: "4.5rem", backgroundColor: "#fff8f2", border: "3px solid #E87722", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "1.875rem", fontWeight: 900, color: "#E87722", lineHeight: 1 }}>{step.n}</span>
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", margin: 0 }}>{step.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: 0, lineHeight: 1.55 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Beneficii pentru restaurant */}
      <section style={{ backgroundColor: "#fafafa", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "3rem" }}>
            {t("landing_benefits_title")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {benefits.map((item, i) => (
              <div key={i} style={{ backgroundColor: "#fff", borderRadius: "1.25rem", padding: "1.75rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <span style={{ fontSize: "1.875rem", flexShrink: 0, marginTop: "0.125rem" }}>{item.emoji}</span>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: "0 0 0.375rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — Statistici */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "1rem" }}>
            {t("landing_stats_title")}
          </h2>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "1.05rem", marginBottom: "3rem" }}>
            {t("landing_stats_sub")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {stats.map((item, i) => (
              <div key={i} style={{ backgroundColor: "#fff", borderRadius: "1.25rem", padding: "2rem", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.875rem" }}>{item.emoji}</div>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#374151", margin: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — Calculator Impact Financiar */}
      <section style={{ backgroundColor: "#fff8f2", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, color: "#111827", marginBottom: "2rem" }}>
            {t("landing_calc_title")}
          </h2>
          <div style={{ backgroundColor: "#fff", borderRadius: "1.5rem", padding: "2.5rem", boxShadow: "0 4px 24px rgba(232,119,34,0.12)", border: "2px solid #fed7aa" }}>
            <p style={{ fontSize: "1.1rem", color: "#374151", lineHeight: 1.7, marginBottom: "1.25rem" }}>
              {t("landing_calc_formula")}
            </p>
            <div style={{ fontSize: "clamp(3rem, 8vw, 4.5rem)", fontWeight: 900, color: "#E87722", lineHeight: 1, marginBottom: "0.75rem" }}>
              {t("landing_calc_amount")}
            </div>
            <p style={{ fontSize: "1rem", color: "#374151", fontWeight: 600, marginBottom: "0.75rem" }}>
              {t("landing_calc_income")}
            </p>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>
              {t("landing_calc_note")}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — Potrivit pentru */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 900, textAlign: "center", color: "#111827", marginBottom: "3rem" }}>
            {t("landing_for_title")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            {forItems.map((item, i) => (
              <div key={i} style={{ backgroundColor: "#fff", borderRadius: "1.25rem", padding: "1.5rem 1rem", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{item.emoji}</div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", margin: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: "linear-gradient(135deg, #E87722, #d96a18)", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, color: "#ffffff", marginBottom: "1rem", lineHeight: 1.25 }}>
            {t("landing_final_cta")}
          </h2>
          <Link href="/demo" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", color: "#E87722", fontWeight: 900, fontSize: "1.125rem", padding: "1.1rem 2.75rem", borderRadius: "1.125rem", textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", marginTop: "1.25rem" }}>
            {t("landing_try_linehop_free")}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #f3f4f6", padding: "1.5rem", textAlign: "center", color: "#9ca3af", fontSize: "0.875rem" }}>
        {t("landing_footer_text")} ·{" "}
        <Link href="/politica-confidentialitate" style={{ color: "#9ca3af", textDecoration: "underline" }}>{t("landing_footer_privacy")}</Link>
        {" · "}
        <Link href="/termeni" style={{ color: "#9ca3af", textDecoration: "underline" }}>{t("landing_footer_terms")}</Link>
      </footer>
    </div>
  );
}
