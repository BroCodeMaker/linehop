import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { closeRestaurant } from "@/lib/queue";

const VALID = ["OPEN", "FULL", "CLOSED"];

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { status } = await req.json();

    if (!VALID.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "CLOSED") {
      await closeRestaurant(id);
      return NextResponse.json({ ok: true, status: "CLOSED" });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, status: restaurant.status });
  } catch (err) {
    console.error("[status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
