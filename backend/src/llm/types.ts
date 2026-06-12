/** Um turno do histórico da conversa, já normalizado para o formato de chat. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Tudo que um provedor precisa para gerar uma resposta. */
export interface ReplyInput {
  /** A mensagem atual do cliente (a ser respondida). */
  userMessage: string;
  /** Turnos anteriores da conversa (mais antigo → mais novo), sem a mensagem atual. */
  history: ChatTurn[];
  /** Base de conhecimento concatenada, usada como contexto/âncora. */
  knowledgeBase: string;
}

/**
 * Abstração do gerador de respostas. Permite trocar OpenAI por um stub
 * determinístico (sem chave/sem custo) sem o worker saber a diferença.
 */
export interface LlmProvider {
  /** Nome curto do provedor — usado em logs/observabilidade. */
  readonly name: string;
  generateReply(input: ReplyInput): Promise<string>;
}
