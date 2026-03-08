import { NextResponse } from "next/server";
import { expireEntries } from "@/lib/expiry";

export async function GET() {
  try {
    const expired = await expireEntries();
    return NextResponse.json({ ok: true, expired });
  } catch (err) {
    console.error("[expire]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
