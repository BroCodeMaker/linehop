"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QRModalProps {
  slug: string;
  restaurantName?: string;
  onClose: () => void;
}

export default function QRModal({ slug, restaurantName, onClose }: QRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${slug}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, joinUrl, {
        width: 280,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      }, (err) => {
        if (!err && canvasRef.current) {
          setDataUrl(canvasRef.current.toDataURL("image/png"));
        }
      });
    }
  }, [joinUrl]);

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${slug}.png`;
    a.click();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 32, maxWidth: 360, width: "90%",
        textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>QR Code</div>
        {restaurantName && (
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>{restaurantName}</div>
        )}
        <canvas ref={canvasRef} style={{ borderRadius: 12, border: "2px solid #e5e7eb" }} />
        <div style={{ fontSize: 11, color: "#9ca3af", margin: "12px 0", wordBreak: "break-all" }}>
          {joinUrl}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            onClick={handleDownload}
            style={{
              padding: "10px 20px", background: "#16a34a", color: "#fff",
              border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14,
            }}
          >
            Descarca PNG
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px", background: "transparent", color: "#6b7280",
              border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
          >
            Inchide
          </button>
        </div>
      </div>
    </div>
  );
}
