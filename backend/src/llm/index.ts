import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { OpenAiProvider } from "./openai-provider.js";
import { StubProvider } from "./stub-provider.js";
import type { LlmProvider } from "./types.js";

export type { LlmProvider, ReplyInput, ChatTurn } from "./types.js";

/**
 * Considera a chave utilizável apenas se parecer uma chave real da OpenAI.
 * Assim o placeholder do .env.example ("sk-...-troque-...") e valores vazios
 * caem automaticamente no StubProvider, sem precisar de configuração extra.
 */
export function isUsableOpenAiKey(key: string | undefined): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith("sk-") && trimmed.length > 20 && !trimmed.includes("troque");
}

interface ProviderOptions {
  apiKey?: string;
  model?: string;
}

/**
 * Escolhe o provedor de LLM em tempo de execução:
 *  - OpenAI, quando há uma chave válida;
 *  - StubProvider (determinístico, sem custo) caso contrário.
 */
export function getLlmProvider(options: ProviderOptions = {}): LlmProvider {
  const apiKey = options.apiKey ?? env.OPENAI_API_KEY;
  const model = options.model ?? env.OPENAI_MODEL;

  if (isUsableOpenAiKey(apiKey)) {
    return new OpenAiProvider({ apiKey, model });
  }

  logger.warn(
    "OPENAI_API_KEY ausente ou inválida — usando StubProvider (respostas determinísticas a partir da base de conhecimento).",
  );
  return new StubProvider();
}
