// Notification provider abstraction
export type NotificationProvider = "mock" | "whatsapp-real" | "twilio";

export interface SendMessageResult {
  ok: boolean;
  provider: NotificationProvider;
  to: string;
  externalId?: string;
  error?: string;
}

export interface NotificationAdapter {
  sendMessage(
    to: string,
    body: string
  ): Promise<SendMessageResult>;
  
  verifyWebhookSignature(
    signature: string,
    body: string
  ): boolean;
}

class MockAdapter implements NotificationAdapter {
  async sendMessage(to: string, body: string): Promise<SendMessageResult> {
    console.log("[WhatsApp MOCK]", { to, body });
    return { ok: true, provider: "mock", to };
  }

  verifyWebhookSignature(_signature: string, _body: string): boolean {
    // Mock always trusts webhooks for local testing
    return true;
  }
}

class WhatsAppRealAdapter implements NotificationAdapter {
  private apiToken: string;
  private phoneNumberId: string;
  private apiUrl: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  async sendMessage(to: string, body: string): Promise<SendMessageResult> {
    if (!this.apiToken || !this.phoneNumberId) {
      console.warn("[WhatsApp] Missing API credentials, falling back to mock");
      return { ok: false, provider: "whatsapp-real", to, error: "Missing credentials" };
    }

    try {
      console.log("[WhatsApp] Sending to:", to, "| URL:", this.apiUrl, "| Token prefix:", this.apiToken.slice(0,20));
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body },
        }),
      });

      const data = (await response.json()) as { messages?: Array<{ id: string }> };
      if (response.ok && data.messages?.[0]) {
        return { ok: true, provider: "whatsapp-real", to, externalId: data.messages[0].id };
      }

      const errText = await response.text().catch(() => "");
      console.log("[WhatsApp] API error:", response.status, errText);
      return { ok: false, provider: "whatsapp-real", to, error: `API error: ${response.status}` };
    } catch (err) {
      return { ok: false, provider: "whatsapp-real", to, error: String(err) };
    }
  }

  verifyWebhookSignature(signature: string, body: string): boolean {
    // Simplified: check X-Hub-Signature header (Meta WhatsApp)
    // In production, compute HMAC-SHA256 with app secret
    if (!signature) return false;
    // For now, just check that signature exists and matches format
    return signature.startsWith("sha256=");
  }
}

class TwilioAdapter implements NotificationAdapter {
  async sendMessage(to: string, body: string): Promise<SendMessageResult> {
    const { sendWhatsApp } = await import("./whatsapp");
    const result = await sendWhatsApp(to, body);
    return {
      ok: result.ok,
      provider: "twilio",
      to,
      externalId: result.sid,
      error: result.error,
    };
  }

  verifyWebhookSignature(_signature: string, _body: string): boolean {
    return true;
  }
}

export function getNotificationAdapter(): NotificationAdapter {
  const provider = process.env.WHATSAPP_PROVIDER || "mock";

  if (provider === "twilio") {
    return new TwilioAdapter();
  }

  if (provider === "whatsapp-real") {
    return new WhatsAppRealAdapter();
  }

  return new MockAdapter();
}
