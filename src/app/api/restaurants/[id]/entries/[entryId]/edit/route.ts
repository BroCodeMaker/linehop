import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id: restaurantId, entryId } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { guestName, partySize, phoneE164 } = body;

  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, restaurantId },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.waitlistEntry.update({
    where: { id: entryId },
    data: {
      ...(guestName !== undefined && { guestName }),
      ...(partySize !== undefined && { partySize: Number(partySize) }),
      ...(phoneE164 !== undefined && { phoneE164 }),
    },
  });

  return NextResponse.json({ ok: true, entry: updated });
}
