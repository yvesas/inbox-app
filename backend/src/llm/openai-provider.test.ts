import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocka a SDK da OpenAI: capturamos os argumentos e controlamos a resposta,
// sem rede. Cobre a montagem das mensagens e o parsing da resposta.
const create = vi.fn();
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create } },
  })),
}));

import { OpenAiProvider } from "./openai-provider.js";

function reply(content: string | null) {
  return { choices: [{ message: { content } }] };
}

const input = {
  userMessage: "Quais os planos?",
  history: [{ role: "user" as const, content: "oi" }],
  knowledgeBase: "Planos: Fibra Start...",
};

describe("OpenAiProvider", () => {
  beforeEach(() => vi.clearAllMocks());

  it("monta a chamada (modelo, temperatura, system+histórico+user) e devolve o conteúdo", async () => {
    create.mockResolvedValue(reply("  Olá! Temos 3 planos.  "));
    const provider = new OpenAiProvider({ apiKey: "fake", model: "gpt-4o-mini" });

    const out = await provider.generateReply(input);

    expect(out).toBe("Olá! Temos 3 planos."); // trim aplicado
    const args = create.mock.calls[0]![0];
    expect(args.model).toBe("gpt-4o-mini");
    expect(args.temperature).toBe(0.2);
    expect(args.messages[0].role).toBe("system");
    expect(args.messages[0].content).toContain("Fibra Start");
    expect(args.messages.at(-1)).toEqual({ role: "user", content: "Quais os planos?" });
  });

  it("lança quando a resposta vem vazia", async () => {
    create.mockResolvedValue(reply(null));
    const provider = new OpenAiProvider({ apiKey: "fake", model: "gpt-4o-mini" });
    await expect(provider.generateReply(input)).rejects.toThrow(/vazia/i);
  });
});
