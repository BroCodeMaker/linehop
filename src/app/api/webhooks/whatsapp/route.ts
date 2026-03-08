import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getNotificationAdapter } from "@/lib/notification-adapter";
import { confirmEntry } from "@/lib/queue";

// WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// WhatsApp webhook for inbound messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify signature (basic, mock adapter always returns true)
    const signature = request.headers.get("x-hub-signature-256") || "";
    const adapter = getNotificationAdapter();
    if (!adapter.verifyWebhookSignature(signature, JSON.stringify(body))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Log the webhook
    console.log("[webhook] Inbound:", JSON.stringify(body, null, 2));

    // Check if this is a message event (not delivery receipt, etc)
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const message = messages[0];
    const fromPhone = message.from;
    const text = message.text?.body?.toUpperCase() || "";

    // Find the guest entry by phone number
    const entry = await prisma.waitlistEntry.findFirst({
      where: {
        phoneE164: fromPhone,
        status: "CALLED",
      },
    });

    if (!entry) {
      console.log("[webhook] No CALLED entry found for phone:", fromPhone);
      return NextResponse.json({ ok: true });
    }

    // Check if still within confirm window
    if (entry.confirmDeadlineAt && entry.confirmDeadlineAt < new Date()) {
      console.log("[webhook] Confirm window expired for entry:", entry.id);
      return NextResponse.json({ ok: true });
    }

    // Check for confirm message
    if (text === "CONFIRM" || text === "1" || text.includes("CONFIRM")) {
      await confirmEntry(entry.id);

      // Log inbound message
      await prisma.messageEvent.create({
        data: {
          entryId: entry.id,
          direction: "inbound",
          provider: "whatsapp-real",
          phoneE164: fromPhone,
          body: message.text?.body || "CONFIRM",
          status: "received",
        },
      });

      console.log("[webhook] Confirmed entry:", entry.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
