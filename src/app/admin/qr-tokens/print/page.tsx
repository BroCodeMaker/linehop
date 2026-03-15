"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Suspense } from "react";

type TokenQr = {
  id: string;
  token: string;
  qrDataUrl: string;
};

function PrintContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const [items, setItems] = useState<TokenQr[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return; }

    async function load() {
      const res = await fetch("/api/admin/qr-tokens");
      if (!res.ok) { setLoading(false); return; }
      const tokens: { id: string; token: string }[] = await res.json();
      const filtered = tokens.filter((t) => ids.includes(t.id));
      const origin = window.location.origin;

      const withQr = await Promise.all(
        filtered.map(async (t) => {
          const url = `${origin}/q/${t.token}`;
          const qrDataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2 });
          return { id: t.id, token: t.token, qrDataUrl };
        })
      );
      setItems(withQr);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading && items.length > 0) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, items]);

  if (loading) {
    return (
      <div style={{ padding: 32, fontFamily: "system-ui, sans-serif", color: "#6b7280" }}>
        Se generează QR-urile...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
        Niciun token selectat.
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: 24,
        background: "#fff",
      }}
    >
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .qr-grid { page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: 24, display: "flex", gap: 12 }}>
        <button
          onClick={() => window.print()}
          style={{
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Printează
        </button>
        <button
          onClick={() => window.close()}
          style={{
            background: "#f3f4f6",
            color: "#111",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Închide
        </button>
      </div>

      <div
        className="qr-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 20,
              textAlign: "center",
              pageBreakInside: "avoid",
            }}
          >
            <img
              src={item.qrDataUrl}
              alt={`QR ${item.token}`}
              style={{ width: 200, height: 200, display: "block", margin: "0 auto 12px" }}
            />
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 4,
                color: "#111",
              }}
            >
              {item.token}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              LineHop
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 32, fontFamily: "system-ui, sans-serif", color: "#6b7280" }}>
          Se încarcă...
        </div>
      }
    >
      <PrintContent />
    </Suspense>
  );
}
