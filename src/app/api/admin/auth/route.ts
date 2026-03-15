import { NextRequest, NextResponse } from "next/server";
import { signSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const SUPER_ADMIN_PASSWORD =
    process.env.SUPER_ADMIN_PASSWORD ?? "linehop2026";

  if (username !== "admin" || password !== SUPER_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Credențiale incorecte" }, { status: 401 });
  }

  const token = signSession({ role: "superadmin", sub: "admin" });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("superadmin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
