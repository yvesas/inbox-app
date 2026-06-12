import { afterEach, describe, expect, it, vi } from "vitest";
import { sendWhatsAppText } from "./delivery.js";
import { env } from "../config/env.js";

function mockFetch(response: { ok: boolean; status?: number; json?: unknown; text?: string }) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: async () => response.json ?? {},
    text: async () => response.text ?? "",
  } as Response);
}

describe("sendWhatsAppText", () => {
  afterEach(() => vi.restoreAllMocks());

  it("faz POST no endpoint da Meta no formato correto e retorna o wamid", async () => {
    const spy = mockFetch({ ok: true, json: { messages: [{ id: "wamid.OUT1" }] } });

    const result = await sendWhatsAppText({ to: "5511999990000", body: "Oi" });

    expect(result.waMessageId).toBe("wamid.OUT1");
    const [url, init] = spy.mock.calls[0]!;
    expect(url).toBe(`${env.META_API_BASE_URL}/${env.META_PHONE_NUMBER_ID}/messages`);
    expect((init as RequestInit).method).toBe("POST");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.authorization).toBe(`Bearer ${env.META_TOKEN}`);
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent).toMatchObject({
      messaging_product: "whatsapp",
      to: "5511999990000",
      type: "text",
      text: { body: "Oi" },
    });
  });

  it("lança em resposta não-ok (para o BullMQ aplicar retry)", async () => {
    mockFetch({ ok: false, status: 503, text: "indisponível" });
    await expect(sendWhatsAppText({ to: "5511999990000", body: "Oi" })).rejects.toThrow(/HTTP 503/);
  });

  it("retorna waMessageId nulo quando a resposta não traz id", async () => {
    mockFetch({ ok: true, json: {} });
    const result = await sendWhatsAppText({ to: "5511999990000", body: "Oi" });
    expect(result.waMessageId).toBeNull();
  });
});
