import { NextRequest, NextResponse } from "next/server";
import { expireEntries } from "@/lib/expiry";

export async function GET(req: NextRequest) {
  // Allow Vercel Cron (Authorization header) or internal calls
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const expired = await expireEntries();
    return NextResponse.json({ ok: true, expired });
  } catch (err) {
    console.error("[expire]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
