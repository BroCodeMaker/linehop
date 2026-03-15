import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const token = req.cookies.get("superadmin_session")?.value;
  if (!token) return false;
  const payload = verifySession(token);
  return payload?.role === "superadmin";
}

function randomToken(len = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count = 1, notes } = await req.json();
  const n = Math.min(Math.max(Number(count) || 1, 1), 100);

  const created = [];
  for (let i = 0; i < n; i++) {
    let token = randomToken();
    // Ensure uniqueness (retry on collision)
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.qrToken.findUnique({ where: { token } });
      if (!existing) break;
      token = randomToken();
      attempts++;
    }
    const qr = await prisma.qrToken.create({
      data: { token, notes: notes || null },
    });
    created.push(qr);
  }

  return NextResponse.json(created);
}
