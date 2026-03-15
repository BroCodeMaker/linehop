"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

type QrToken = {
  id: string;
  token: string;
  status: string;
  restaurantId: string | null;
  restaurant: { id: string; name: string; slug: string } | null;
  createdAt: string;
  claimedAt: string | null;
  firstScannedAt: string | null;
  notes: string | null;
};

type Restaurant = {
  id: string;
  name: string;
  slug: string;
};

type TokenDetails = QrToken & {
  entriesData: {
    todayCount: number;
    activeEntries: { id: string; guestName: string | null; partySize: number; status: string; createdAt: string }[];
  } | null;
  errorLogs: { id: string; subject: string; description: string; status: string; createdAt: string }[];
};

export default function QrTokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<QrToken[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateCount, setGenerateCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [mappingId, setMappingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [detailsToken, setDetailsToken] = useState<TokenDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function loadAll() {
    const [tokensRes, restsRes] = await Promise.all([
      fetch("/api/admin/qr-tokens"),
      fetch("/api/admin/restaurants"),
    ]);
    if (tokensRes.status === 401) { router.push("/admin/login"); return; }
    if (tokensRes.ok) setTokens(await tokensRes.json());
    if (restsRes.ok) setRestaurants(await restsRes.json());
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    const res = await fetch("/api/admin/qr-tokens/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: generateCount }),
    });
    if (!res.ok) {
      setError("Eroare la generare");
    } else {
      await loadAll();
    }
    setGenerating(false);
  }

  async function handleMap(tokenId: string, restaurantId: string) {
    setMappingId(tokenId);
    await fetch(`/api/admin/qr-tokens/${tokenId}/map`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: restaurantId || null }),
    });
    await loadAll();
    setMappingId(null);
  }

  async function handleDownloadQr(token: string) {
    const origin = window.location.origin;
    const url = `${origin}/q/${token}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `QR-${token}.png`;
    a.click();
  }

  async function handleDelete(t: QrToken) {
    if (!confirm(`Ștergi token-ul ${t.token}? Această acțiune nu poate fi anulată.`)) return;
    const res = await fetch(`/api/admin/qr-tokens/${t.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await loadAll();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Eroare la ștergere");
    }
  }

  async function handleDetails(t: QrToken) {
    setDetailsLoading(true);
    setDetailsToken(null);
    const res = await fetch(`/api/admin/qr-tokens/${t.id}`, { credentials: "include" });
    if (res.ok) {
      setDetailsToken(await res.json());
    }
    setDetailsLoading(false);
  }

  function handlePrint(selected: string[]) {
    if (selected.length === 0) return;
    window.open(
      `/admin/qr-tokens/print?ids=${selected.join(",")}`,
      "_blank"
    );
  }

  const [selected, setSelected] = useState<string[]>([]);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

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
        <span style={{ fontWeight: 700, fontSize: 16 }}>QR Token Management</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        {/* Generate form */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>
            Generează Tokens Noi
          </h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label
                style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}
              >
                Număr tokens
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                style={{
                  width: 80,
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                marginTop: 22,
                background: generating ? "#9ca3af" : "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "9px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: generating ? "not-allowed" : "pointer",
              }}
            >
              {generating ? "Se generează..." : "Generează"}
            </button>
            {selected.length > 0 && (
              <button
                onClick={() => handlePrint(selected)}
                style={{
                  marginTop: 22,
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Printează selectate ({selected.length})
              </button>
            )}
          </div>
          {error && (
            <div
              style={{
                marginTop: 12,
                background: "#fee2e2",
                color: "#b91c1c",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Token list */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            padding: 24,
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>
            Tokens ({tokens.length})
          </h2>

          {tokens.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              Niciun token generat.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={selected.length === tokens.length}
                        onChange={() =>
                          setSelected(
                            selected.length === tokens.length ? [] : tokens.map((t) => t.id)
                          )
                        }
                      />
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Token</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Restaurant</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Creat</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: selected.includes(t.id) ? "#f0f9ff" : "#fff",
                      }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <input
                          type="checkbox"
                          checked={selected.includes(t.id)}
                          onChange={() => toggleSelect(t.id)}
                        />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#111",
                            letterSpacing: 2,
                          }}
                        >
                          {t.token}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            background: t.status === "claimed" ? "#dcfce7" : "#f3f4f6",
                            color: t.status === "claimed" ? "#16a34a" : "#6b7280",
                            borderRadius: 20,
                            padding: "2px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <select
                          value={t.restaurantId ?? ""}
                          disabled={mappingId === t.id}
                          onChange={(e) => handleMap(t.id, e.target.value)}
                          style={{
                            padding: "6px 10px",
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 13,
                            minWidth: 160,
                          }}
                        >
                          <option value="">— Neclamat —</option>
                          {restaurants.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          color: "#9ca3af",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(t.createdAt).toLocaleDateString("ro-RO")}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleDownloadQr(t.token)}
                            style={{
                              background: "#f3f4f6",
                              color: "#111",
                              border: "none",
                              borderRadius: 6,
                              padding: "6px 12px",
                              fontSize: 12,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            ↓ QR
                          </button>
                          <button
                            onClick={() => handleDetails(t)}
                            style={{
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "none",
                              borderRadius: 6,
                              padding: "6px 12px",
                              fontSize: 12,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            🔍 Detalii
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            style={{
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "none",
                              borderRadius: 6,
                              padding: "6px 12px",
                              fontSize: 12,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            🗑️ Șterge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {(detailsLoading || detailsToken) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => { setDetailsToken(null); }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              maxWidth: 560,
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {detailsLoading ? (
              <div style={{ textAlign: "center", color: "#6b7280", padding: "32px 0" }}>Se încarcă...</div>
            ) : detailsToken ? (
              <>
                <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
                  Detalii Token: <span style={{ fontFamily: "monospace", letterSpacing: 2 }}>{detailsToken.token}</span>
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, fontSize: 13 }}>
                  <div><strong>ID:</strong> <span style={{ fontFamily: "monospace", color: "#6b7280" }}>{detailsToken.id}</span></div>
                  <div><strong>Status:</strong> <span style={{
                    background: detailsToken.status === "claimed" ? "#dcfce7" : "#f3f4f6",
                    color: detailsToken.status === "claimed" ? "#16a34a" : "#6b7280",
                    borderRadius: 12, padding: "1px 8px", fontSize: 11, fontWeight: 700,
                  }}>{detailsToken.status}</span></div>
                  <div><strong>Creat la:</strong> {new Date(detailsToken.createdAt).toLocaleString("ro-RO")}</div>
                  {detailsToken.claimedAt && <div><strong>Clamat la:</strong> {new Date(detailsToken.claimedAt).toLocaleString("ro-RO")}</div>}
                  {detailsToken.firstScannedAt && <div><strong>Prima scanare:</strong> {new Date(detailsToken.firstScannedAt).toLocaleString("ro-RO")}</div>}
                </div>

                {detailsToken.restaurant && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Restaurant asociat</h3>
                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                      <div><strong>{detailsToken.restaurant.name}</strong> <span style={{ color: "#9ca3af" }}>/{detailsToken.restaurant.slug}</span></div>
                    </div>
                  </div>
                )}

                {detailsToken.entriesData && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#374151" }}>
                      Entries azi: <span style={{ color: "#2563eb" }}>{detailsToken.entriesData.todayCount}</span>
                    </h3>
                    {detailsToken.entriesData.activeEntries.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {detailsToken.entriesData.activeEntries.map((e) => (
                          <div key={e.id} style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                            <span>{e.guestName ?? "—"} ({e.partySize} pers.)</span>
                            <span style={{ color: "#6b7280" }}>{e.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#9ca3af", fontSize: 13 }}>Nicio intrare activă.</div>
                    )}
                  </div>
                )}

                {detailsToken.errorLogs.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Ultimele 5 erori</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {detailsToken.errorLogs.map((err) => (
                        <div key={err.id} style={{ background: "#fff7ed", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: "#92400e" }}>{err.subject}</div>
                          <div style={{ color: "#6b7280", marginTop: 2 }}>{err.description}</div>
                          <div style={{ color: "#d1d5db", fontSize: 11, marginTop: 2 }}>{new Date(err.createdAt).toLocaleString("ro-RO")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setDetailsToken(null)}
                  style={{
                    padding: "9px 20px",
                    background: "#111827",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Închide
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
