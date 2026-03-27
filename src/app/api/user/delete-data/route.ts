import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

const DeleteSchema = z.object({
  phone: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const token = request.headers.get("X-Delete-Token");
  const expected = process.env.DATA_DELETE_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const phoneE164 = normalizePhone(parsed.data.phone);

  const result = await prisma.waitlistEntry.deleteMany({
    where: { phoneE164 },
  });

  return NextResponse.json({ success: true, deleted: result.count });
}
