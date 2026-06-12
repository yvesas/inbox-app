import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const { generateReply } = vi.hoisted(() => ({ generateReply: vi.fn() }));

vi.mock("../llm/index.js", () => ({
  getLlmProvider: () => ({ name: "stub", generateReply }),
}));
vi.mock("../knowledge-base/kb.js", () => ({
  loadKnowledgeBase: vi.fn().mockResolvedValue("KB"),
}));
vi.mock("./context.js", () => ({ loadInboundContext: vi.fn() }));
vi.mock("./delivery.js", () => ({ sendWhatsAppText: vi.fn() }));
vi.mock("./outbound.js", () => ({ recordReply: vi.fn() }));

import { processIncoming } from "./process-incoming.js";
import { loadInboundContext } from "./context.js";
import { sendWhatsAppText } from "./delivery.js";
import { recordReply } from "./outbound.js";

const loadCtx = loadInboundContext as Mock;
const send = sendWhatsAppText as Mock;
const record = recordReply as Mock;

const JOB = { tenantId: "t1", conversationId: "c1", waMessageId: "wamid.ABC" };

function ctx(status: string) {
  return {
    inbound: { id: "msg-1", status, body: "Quais os planos?" },
    conversationId: "c1",
    contactWaId: "5511999990000",
    history: [],
  };
}

describe("processIncoming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateReply.mockResolvedValue("Resposta da IA");
    send.mockResolvedValue({ waMessageId: "wamid.OUT" });
    record.mockResolvedValue(undefined);
  });

  it("caminho feliz: gera, entrega e persiste", async () => {
    loadCtx.mockResolvedValue(ctx("received"));

    await processIncoming(JOB);

    expect(generateReply).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith({ to: "5511999990000", body: "Resposta da IA" });
    expect(record).toHaveBeenCalledWith({
      tenantId: "t1",
      conversationId: "c1",
      inboundId: "msg-1",
      body: "Resposta da IA",
      waMessageId: "wamid.OUT",
    });
  });

  it("idempotência: inbound já 'replied' sai cedo, sem gerar/entregar", async () => {
    loadCtx.mockResolvedValue(ctx("replied"));

    await processIncoming(JOB);

    expect(generateReply).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it("inbound inexistente: não faz nada", async () => {
    loadCtx.mockResolvedValue(null);

    await processIncoming(JOB);

    expect(generateReply).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("falha de entrega propaga (BullMQ fará retry) e NÃO persiste", async () => {
    loadCtx.mockResolvedValue(ctx("received"));
    send.mockRejectedValue(new Error("HTTP 503"));

    await expect(processIncoming(JOB)).rejects.toThrow(/503/);
    expect(record).not.toHaveBeenCalled();
  });
});
