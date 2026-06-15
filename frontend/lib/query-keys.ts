/**
 * Chaves de query centralizadas — fonte única para cache e invalidação consistente.
 * Mantê-las aqui evita strings soltas espalhadas e divergências entre quem lê e
 * quem invalida o cache (ex.: o optimistic update do envio invalida `messages` e
 * `conversations` usando exatamente estas chaves).
 */
export const queryKeys = {
  me: ["me"] as const,
  conversations: ["conversations"] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
};
