import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });
  const payload = verifySession(token);
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, ...payload });
}
