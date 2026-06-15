import { describe, expect, it } from "vitest";
import { OpenAiProvider } from "./openai-provider.js";

/**
 * Integração real do OpenAiProvider contra o `mock-openai-server` (API compatível
 * com Chat Completions). Aqui NÃO mockamos a SDK: o provider abre uma conexão HTTP
 * de verdade, a SDK serializa a chamada e fazemos o parsing da resposta real —
 * exercitando o caminho da IA offline, sem chave nem custo.
 *
 * É pulado automaticamente quando o mock não está no ar, para que `npm test`
 * continue verde sem docker (sobe com `docker compose up -d mock-openai`).
 */
const MOCK_OPENAI_BASE_URL = "http://localhost:8002/v1";

async function mockReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${MOCK_OPENAI_BASE_URL}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const available = await mockReachable();

describe.skipIf(!available)("OpenAiProvider (integração — mock-openai real)", () => {
  it("fala HTTP de verdade com a API compatível e devolve o conteúdo", async () => {
    const provider = new OpenAiProvider({
      apiKey: "fake-key", // qualquer valor não-vazio basta com baseURL
      model: "gpt-4o-mini",
      baseURL: MOCK_OPENAI_BASE_URL,
    });

    const reply = await provider.generateReply({
      userMessage: "Quais os planos e precos?",
      history: [],
      knowledgeBase: "Planos: Fibra Start, Fibra Plus.",
    });

    // O mock ecoa a última mensagem do usuário e se identifica como simulado.
    expect(reply).toContain("[mock-openai]");
    expect(reply).toContain("Quais os planos e precos?");
  });
});
