/**
 * Adaptador WhatsApp Cloud API
 * Controlado por WHATSAPP_MODE=mock|live
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface WaMessage {
  to: string;
  text?: string;
  templateName?: string;
  templateParams?: string[];
}

export interface WaMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface WhatsAppAdapter {
  sendText(to: string, text: string): Promise<WaMessageResult>;
  sendTemplate(to: string, templateName: string, params: string[]): Promise<WaMessageResult>;
  verifyWebhook(token: string): boolean;
  validateSignature(body: string, signature: string): boolean;
}

class MockWhatsAppAdapter implements WhatsAppAdapter {
  sendText(to: string, text: string): Promise<WaMessageResult> {
    console.info(`[WA MOCK] Texto a ${to}: ${text.slice(0, 80)}…`);
    return Promise.resolve({ success: true, messageId: `mock_${Date.now()}` });
  }

  sendTemplate(to: string, templateName: string, params: string[]): Promise<WaMessageResult> {
    console.info(`[WA MOCK] Plantilla "${templateName}" a ${to}, params:`, params);
    return Promise.resolve({ success: true, messageId: `mock_tmpl_${Date.now()}` });
  }

  verifyWebhook(token: string): boolean {
    return token === process.env.WHATSAPP_VERIFY_TOKEN;
  }

  validateSignature(): boolean {
    return true; // mock siempre válido
  }
}

class LiveWhatsAppAdapter implements WhatsAppAdapter {
  private readonly token = process.env.WHATSAPP_TOKEN!;
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  private readonly appSecret = process.env.WHATSAPP_APP_SECRET!;

  async sendText(to: string, text: string): Promise<WaMessageResult> {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }
    const data = await res.json() as { messages?: { id: string }[] };
    return { success: true, messageId: data.messages?.[0]?.id };
  }

  async sendTemplate(to: string, templateName: string, params: string[]): Promise<WaMessageResult> {
    const components = params.length
      ? [{ type: "body", parameters: params.map((p) => ({ type: "text", text: p })) }]
      : [];
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: { name: templateName, language: { code: "es_ES" }, components },
        }),
      }
    );
    if (!res.ok) return { success: false, error: await res.text() };
    const data = await res.json() as { messages?: { id: string }[] };
    return { success: true, messageId: data.messages?.[0]?.id };
  }

  verifyWebhook(token: string): boolean {
    return token === process.env.WHATSAPP_VERIFY_TOKEN;
  }

  validateSignature(body: string, signature: string): boolean {
    const expected = "sha256=" + createHmac("sha256", this.appSecret).update(body).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}

const mode = process.env.WHATSAPP_MODE ?? "mock";
export const whatsappAdapter: WhatsAppAdapter =
  mode === "live" ? new LiveWhatsAppAdapter() : new MockWhatsAppAdapter();

/* ───────────── Envío multi-tenant (credenciales por clínica) ───────────── */

export interface WaCreds {
  token?: string | null;
  phoneNumberId?: string | null;
}

/**
 * Envía un texto usando las credenciales de la clínica (org_integrations.config).
 * Si faltan credenciales hace fallback a las del entorno; en modo mock solo loguea.
 */
export async function sendWhatsAppTextAs(creds: WaCreds, to: string, text: string): Promise<WaMessageResult> {
  if (mode !== "live") {
    console.info(`[WA MOCK·org] Texto a ${to}: ${text.slice(0, 80)}…`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }
  const token = creds.token || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = creds.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { success: false, error: "WhatsApp no está conectado para esta clínica." };
  }
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  if (!res.ok) return { success: false, error: await res.text() };
  const data = (await res.json()) as { messages?: { id: string }[] };
  return { success: true, messageId: data.messages?.[0]?.id };
}

/** Valida la firma HMAC de Meta con un app secret concreto (el de la clínica). */
export function validateSignatureWith(appSecret: string, body: string, signature: string): boolean {
  const expected = "sha256=" + createHmac("sha256", appSecret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isWhatsAppLive(): boolean {
  return mode === "live";
}
