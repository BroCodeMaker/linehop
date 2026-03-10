import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

export async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; sid?: string; error?: string }> {
  if (!to || !to.match(/^\+?[1-9]\d{6,14}$/)) {
    return { ok: false, error: "Invalid phone number" };
  }
  try {
    const toWA = to.startsWith("whatsapp:") ? to : `whatsapp:${to.startsWith("+") ? to : "+" + to}`;
    const msg = await client.messages.create({
      from: FROM,
      to: toWA,
      body,
    });
    console.log(`[WhatsApp] Sent to ${toWA}: ${msg.sid}`);
    return { ok: true, sid: msg.sid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[WhatsApp] Error: ${message}`);
    return { ok: false, error: message };
  }
}
