import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  return !!verifySession(token);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  let settings = await prisma.restaurantSettings.findUnique({ where: { restaurantId: id } });
  if (!settings) {
    settings = await prisma.restaurantSettings.create({ data: { restaurantId: id } });
  }
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const body = await request.json();

  // Validate maxQueueSize — cap at 50
  if (body.maxQueueSize !== undefined) {
    const val = Number(body.maxQueueSize);
    if (val > 50) {
      return NextResponse.json({ error: "maxQueueSize cannot exceed 50" }, { status: 400 });
    }
    body.maxQueueSize = val;
  }

  const settings = await prisma.restaurantSettings.upsert({
    where: { restaurantId: id },
    update: {
      confirmTimerSec: body.confirmTimerSec !== undefined ? Number(body.confirmTimerSec) : undefined,
      arrivalTimerSec: body.arrivalTimerSec !== undefined ? Number(body.arrivalTimerSec) : undefined,
      bufferVisibilitySec: body.bufferVisibilitySec !== undefined ? Number(body.bufferVisibilitySec) : undefined,
      maxCallAgain: body.maxCallAgain !== undefined ? Number(body.maxCallAgain) : undefined,
      maxPartySize: body.maxPartySize !== undefined ? Number(body.maxPartySize) : undefined,
      maxQueueSize: body.maxQueueSize !== undefined ? Number(body.maxQueueSize) : undefined,
      waitMinutesPerGroup: body.waitMinutesPerGroup !== undefined ? Number(body.waitMinutesPerGroup) : undefined,
      estimatedTableTimeMin: body.estimatedTableTimeMin !== undefined ? Number(body.estimatedTableTimeMin) : undefined,
      msgWhatsappCall: body.msgWhatsappCall,
      msgWhatsappExpire: body.msgWhatsappExpire,
      msgWhatsappCallAgain: body.msgWhatsappCallAgain,
    },
    create: { restaurantId: id, ...body },
  });
  return NextResponse.json({ ok: true, settings });
}
