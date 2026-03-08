import { NextResponse } from "next/server";
import { callNext } from "@/lib/queue";
import { sendWhatsAppMessage } from "@/lib/notify";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const entry = await callNext(id);

    if (!entry) {
      return NextResponse.json({ ok: false, message: "No WAITING entries" }, { status: 200 });
    }

    await sendWhatsAppMessage(
      entry.id,
      entry.phoneE164,
      `Your table is ready! Please confirm within 2 minutes by replying CONFIRM. 🍽️`
    );

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("[call-next]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
