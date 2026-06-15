import { describe, expect, it } from "vitest";
import { buildChatMessages, buildSystemPrompt } from "./prompt.js";
import { getLlmProvider, isUsableOpenAiKey } from "./index.js";

describe("buildSystemPrompt", () => {
  it("ancora o prompt na base e instrui contra alucinação", () => {
    const prompt = buildSystemPrompt("Plano Fibra Start: R$ 79,90.");
    expect(prompt).toContain("Plano Fibra Start: R$ 79,90.");
    expect(prompt).toMatch(/SOMENTE com base/i);
    expect(prompt).toMatch(/não tem essa informação|NUNCA invente/i);
  });
});

describe("buildChatMessages", () => {
  it("monta system + histórico + mensagem atual na ordem certa", () => {
    const messages = buildChatMessages({
      userMessage: "qual o preço?",
      knowledgeBase: "KB",
      history: [
        { role: "user", content: "oi" },
        { role: "assistant", content: "Olá, como posso ajudar?" },
      ],
    });

    expect(messages.map((m) => m.role)).toEqual(["system", "user", "assistant", "user"]);
    expect(messages[0]?.content).toContain("KB");
    expect(messages.at(-1)?.content).toBe("qual o preço?");
  });
});

describe("isUsableOpenAiKey", () => {
  it("aceita uma chave com formato plausível", () => {
    expect(isUsableOpenAiKey("sk-proj-" + "a".repeat(40))).toBe(true);
  });

  it("rejeita vazio, placeholder e formatos inválidos", () => {
    expect(isUsableOpenAiKey("")).toBe(false);
    expect(isUsableOpenAiKey(undefined)).toBe(false);
    expect(isUsableOpenAiKey("sk-proj-troque-pela-sua-chave")).toBe(false);
    expect(isUsableOpenAiKey("não-é-uma-chave")).toBe(false);
  });
});

describe("getLlmProvider (seleção de provedor)", () => {
  it("usa o stub sem chave e sem baseURL", () => {
    expect(getLlmProvider({ apiKey: "", baseURL: "" }).name).toBe("stub");
  });

  it("usa OpenAI com baseURL (fake) + chave fictícia", () => {
    expect(getLlmProvider({ apiKey: "fake-key", baseURL: "http://localhost:8002/v1" }).name).toBe(
      "openai",
    );
  });

  it("usa OpenAI com chave válida", () => {
    expect(getLlmProvider({ apiKey: "sk-proj-" + "a".repeat(40), baseURL: "" }).name).toBe(
      "openai",
    );
  });
});
