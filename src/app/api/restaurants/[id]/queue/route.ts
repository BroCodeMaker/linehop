import { NextResponse } from "next/server";
import { getQueue } from "@/lib/queue";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const entries = await getQueue(id);
    return NextResponse.json({ ok: true, entries });
  } catch (err) {
    console.error("[queue]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
