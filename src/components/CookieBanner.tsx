"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("cookieConsent");
      if (!consent) setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookieConsent", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={s.overlay}>
      <div style={s.banner}>
        <p style={s.text}>
          Folosim cookie-uri esențiale pentru funcționarea aplicației.{" "}
          <a href="/politica-confidentialitate" style={s.link}>
            Politica de confidențialitate
          </a>
        </p>
        <button onClick={accept} style={s.btn}>
          Accept
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: "12px 16px",
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  banner: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 700,
    width: "100%",
  },
  text: {
    color: "#f3f4f6",
    fontSize: 13,
    margin: 0,
    lineHeight: 1.5,
    flex: 1,
    minWidth: 200,
  },
  link: {
    color: "#fb923c",
    textDecoration: "underline",
  },
  btn: {
    background: "#E87722",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
