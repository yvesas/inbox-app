import { describe, expect, it } from "vitest";
import { generateStubReply } from "./stub-provider.js";

// Mini base de conhecimento que imita o formato real (com cabeçalho de fonte).
const KB = [
  "### Fonte: planos-e-precos.md",
  "",
  "## Planos residenciais",
  "",
  "Fibra Start 300 Mbps custa R$ 79,90 por mês. Fibra Max 1 Gbps custa R$ 149,90 por mês.",
  "",
  "---",
  "",
  "### Fonte: suporte-e-sla.md",
  "",
  "## Procedimento para queda de conexão",
  "",
  "Reinicie o roteador: desligue da tomada por 30 segundos e ligue novamente.",
].join("\n");

function reply(userMessage: string): string {
  return generateStubReply({ userMessage, history: [], knowledgeBase: KB });
}

describe("StubProvider (generateStubReply)", () => {
  it("saúda quando o cliente cumprimenta", () => {
    expect(reply("Oi")).toMatch(/assistente virtual da NeoFibra/i);
  });

  it("encontra o bloco relevante da base por palavras-chave", () => {
    const answer = reply("quanto custa o plano Fibra Max?");
    expect(answer).toContain("149,90");
    // Não deve vazar o título markdown do bloco.
    expect(answer).not.toMatch(/^#/m);
  });

  it("recupera procedimento de suporte pela intenção", () => {
    expect(reply("tive uma queda de conexão, o que faço?")).toMatch(/roteador/i);
  });

  it("admite quando não sabe, sem inventar", () => {
    const answer = reply("vocês vendem celular samsung?");
    expect(answer).toMatch(/não tenho essa informação|atendente humano/i);
  });
});
