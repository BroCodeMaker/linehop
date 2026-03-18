import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const VERCEL_WEBHOOK_SECRET = process.env.VERCEL_WEBHOOK_SECRET;

async function sendTelegram(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Vercel signature
    if (VERCEL_WEBHOOK_SECRET) {
      const signature = req.headers.get("x-vercel-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      const expected = crypto
        .createHmac("sha1", VERCEL_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      // Vercel sends the raw hex, not prefixed
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const type = payload.type as string;

    if (type === "deployment.succeeded") {
      const d = payload.payload?.deployment;
      const url = d?.url ? `https://${d.url}` : "https://linehop.app";
      const branch = d?.meta?.githubCommitRef || "main";
      const msg = d?.meta?.githubCommitMessage?.split("\n")[0] || "";
      await sendTelegram(
        `✅ <b>Deploy reușit!</b>\nBranch: <code>${branch}</code>\n${msg ? `Commit: ${msg}\n` : ""}URL: ${url}`
      );
    } else if (type === "deployment.error" || type === "deployment.canceled") {
      const d = payload.payload?.deployment;
      const branch = d?.meta?.githubCommitRef || "main";
      const emoji = type === "deployment.canceled" ? "⚠️" : "❌";
      const label = type === "deployment.canceled" ? "Deploy anulat" : "Deploy eșuat";
      await sendTelegram(
        `${emoji} <b>${label}</b>\nBranch: <code>${branch}</code>\nVerifică Vercel dashboard.`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vercel-deploy webhook]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
