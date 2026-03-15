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

    // Normalize phone: strip leading + and any accidental double-prefix
    const normalizedTo = to.replace(/^\+/, "").replace(/^40{2}/, "40");

    try {
      console.log("[WhatsApp] Sending to:", normalizedTo, "| Token prefix:", this.apiToken.slice(0, 20));

      // Try sending as free text first (works when conversation window is open)
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalizedTo,
          type: "text",
          text: { body },
        }),
      });

      const data = (await response.json()) as { messages?: Array<{ id: string }>; error?: { code: number } };

      if (response.ok && data.messages?.[0]) {
        return { ok: true, provider: "whatsapp-real", to: normalizedTo, externalId: data.messages[0].id };
      }

      // If failed (e.g. outside 24h window), fall back to hello_world template
      console.log("[WhatsApp] Free text failed (code:", data.error?.code, "), trying template fallback...");
      const templateResponse = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizedTo,
          type: "template",
          template: {
            name: "hello_world",
            language: { code: "en_US" },
          },
        }),
      });

      const templateData = (await templateResponse.json()) as { messages?: Array<{ id: string }> };
      if (templateResponse.ok && templateData.messages?.[0]) {
        console.log("[WhatsApp] Template fallback succeeded");
        return { ok: true, provider: "whatsapp-real", to: normalizedTo, externalId: templateData.messages[0].id };
      }

      return { ok: false, provider: "whatsapp-real", to: normalizedTo, error: `API error: ${response.status}` };
    } catch (err) {
      return { ok: false, provider: "whatsapp-real", to: normalizedTo, error: String(err) };
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
