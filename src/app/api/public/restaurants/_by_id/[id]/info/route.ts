import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, slug: true },
    });
    if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ name: restaurant.name, status: restaurant.status, slug: restaurant.slug });
  } catch (err) {
    console.error("[by_id/info]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
