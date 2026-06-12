import { describe, expect, it } from "vitest";
import { metaWebhookSchema } from "./meta-schema.js";

function inboundPayload() {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_ID",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { phone_number_id: "123456789012345" },
              contacts: [{ profile: { name: "Ana" }, wa_id: "5511999990000" }],
              messages: [
                {
                  from: "5511999990000",
                  id: "wamid.ABC",
                  timestamp: "1700000000",
                  type: "text",
                  text: { body: "Olá" },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe("metaWebhookSchema", () => {
  it("valida um envelope inbound completo", () => {
    const parsed = metaWebhookSchema.safeParse(inboundPayload());
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const msg = parsed.data.entry[0]?.changes[0]?.value.messages?.[0];
      expect(msg?.id).toBe("wamid.ABC");
      expect(msg?.text?.body).toBe("Olá");
    }
  });

  it("aceita value sem messages (eventos de status, etc.)", () => {
    const payload = inboundPayload();
    delete (payload.entry[0]!.changes[0]!.value as Record<string, unknown>).messages;
    expect(metaWebhookSchema.safeParse(payload).success).toBe(true);
  });

  it("rejeita payload sem entry", () => {
    expect(metaWebhookSchema.safeParse({ object: "x" }).success).toBe(false);
  });

  it("rejeita mensagem sem id (sem chave de idempotência)", () => {
    const payload = inboundPayload();
    delete (payload.entry[0]!.changes[0]!.value.messages![0] as Record<string, unknown>).id;
    expect(metaWebhookSchema.safeParse(payload).success).toBe(false);
  });
});
