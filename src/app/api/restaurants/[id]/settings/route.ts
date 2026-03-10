import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  if (!cookieStore.get("auth_token")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await prisma.restaurantSettings.findUnique({ where: { restaurantId: id } });
  if (!settings) {
    settings = await prisma.restaurantSettings.create({ data: { restaurantId: id } });
  }
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  if (!cookieStore.get("auth_token")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const settings = await prisma.restaurantSettings.upsert({
    where: { restaurantId: id },
    update: {
      confirmTimerSec: body.confirmTimerSec !== undefined ? Number(body.confirmTimerSec) : undefined,
      arrivalTimerSec: body.arrivalTimerSec !== undefined ? Number(body.arrivalTimerSec) : undefined,
      bufferVisibilitySec: body.bufferVisibilitySec !== undefined ? Number(body.bufferVisibilitySec) : undefined,
      maxCallAgain: body.maxCallAgain !== undefined ? Number(body.maxCallAgain) : undefined,
      maxPartySize: body.maxPartySize !== undefined ? Number(body.maxPartySize) : undefined,
      maxQueueSize: body.maxQueueSize !== undefined ? Number(body.maxQueueSize) : undefined,
      msgWhatsappCall: body.msgWhatsappCall,
      msgWhatsappExpire: body.msgWhatsappExpire,
      msgWhatsappCallAgain: body.msgWhatsappCallAgain,
    },
    create: { restaurantId: id, ...body },
  });
  return NextResponse.json({ ok: true, settings });
}
