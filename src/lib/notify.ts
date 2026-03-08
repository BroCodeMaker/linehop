import prisma from "./prisma";
import { getNotificationAdapter, SendMessageResult } from "./notification-adapter";

export async function sendWhatsAppMessage(
  entryId: string,
  to: string,
  body: string
): Promise<SendMessageResult> {
  const adapter = getNotificationAdapter();
  const result = await adapter.sendMessage(to, body);

  // Log message event
  try {
    await prisma.messageEvent.create({
      data: {
        entryId,
        direction: "outbound",
        provider: result.provider,
        phoneE164: to,
        body,
        status: result.ok ? "sent" : "failed",
        externalId: result.externalId,
      },
    });
  } catch (err) {
    console.error("[notify] Failed to log message event:", err);
  }

  return result;
}
