import OpenAI from "openai";
import { buildChatMessages } from "./prompt.js";
import type { LlmProvider, ReplyInput } from "./types.js";

interface OpenAiProviderOptions {
  apiKey: string;
  model: string;
  /** Opcional: redireciona a SDK para uma API compatível (ex.: mock-openai). */
  baseURL?: string;
}

/**
 * Provedor baseado na OpenAI (gpt-4o-mini por padrão). Usado quando há uma
 * OPENAI_API_KEY válida — ou quando um baseURL aponta para uma API compatível
 * (o mock-openai, para rodar offline). Sem isso, o worker cai no StubProvider.
 */
export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: OpenAiProviderOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      ...(options.baseURL ? { baseURL: options.baseURL } : {}),
    });
    this.model = options.model;
  }

  async generateReply(input: ReplyInput): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      // temperatura baixa: respostas mais determinísticas e fiéis à base.
      temperature: 0.2,
      messages: buildChatMessages(input),
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("OpenAI retornou resposta vazia");
    }
    return content;
  }
}
