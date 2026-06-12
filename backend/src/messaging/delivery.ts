import { env } from "../config/env.js";

interface SendTextParams {
  to: string;
  body: string;
}

interface SendTextResult {
  /** wamid devolvido pela Meta (mock), quando presente. */
  waMessageId: string | null;
}

/**
 * Entrega uma resposta de texto via Meta WhatsApp Cloud API (mock em dev):
 *   POST {META_API_BASE_URL}/{META_PHONE_NUMBER_ID}/messages
 *   Authorization: Bearer {META_TOKEN}
 *
 * Lança em caso de falha — o BullMQ cuida do retry/backoff.
 */
export async function sendWhatsAppText(params: SendTextParams): Promise<SendTextResult> {
  const url = `${env.META_API_BASE_URL}/${env.META_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.META_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: params.to,
      type: "text",
      text: { preview_url: false, body: params.body },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`falha ao entregar resposta (HTTP ${response.status}) ${detail}`.trim());
  }

  const data = (await response.json().catch(() => null)) as
    | { messages?: Array<{ id?: string }> }
    | null;

  return { waMessageId: data?.messages?.[0]?.id ?? null };
}
