"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getMe,
  getMessages,
  sendMessage,
  suggestReply,
  type Conversation,
  type Message,
} from "./api";
import { queryKeys } from "./query-keys";

/**
 * Hooks que envolvem as funções de `lib/api.ts`. Toda interação com o servidor passa
 * por aqui — os componentes consomem hooks, não o axios direto. Centralizar também
 * mantém a estratégia de cache (polling, optimistic, invalidação) num só lugar.
 */

// Conversas: polling moderado p/ refletir novas mensagens na lista (live updates).
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: getConversations,
    refetchInterval: 8_000,
  });
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: getMe });
}

// Mensagens da conversa aberta: polling mais ágil enquanto a conversa está em foco.
export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId ?? ""),
    queryFn: () => getMessages(conversationId as string),
    enabled: Boolean(conversationId),
    refetchInterval: 5_000,
  });
}

interface OptimisticContext {
  previous: Message[] | undefined;
}

/**
 * Envio com **optimistic update**: injeta uma mensagem provisória (`direction:"out"`)
 * no cache antes da resposta do servidor; em erro, faz rollback; ao concluir, invalida
 * `messages` + `conversations` para reconciliar com o servidor (e atualizar a prévia
 * da lista). O caminho de erro é tratado de propósito — é onde a UX se ganha.
 */
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();

  return useMutation<Message, Error, string, OptimisticContext>({
    mutationFn: (text: string) => sendMessage(conversationId, text),

    onMutate: async (text) => {
      const key = queryKeys.messages(conversationId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Message[]>(key);

      const optimistic: Message = {
        id: `optimistic-${previous?.length ?? 0}-${text.length}`,
        direction: "out",
        body: text,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<Message[]>(key, [...(previous ?? []), optimistic]);

      return { previous };
    },

    onError: (_err, _text, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.messages(conversationId), context.previous);
      }
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

/**
 * Sugestão de IA: `useMutation` que NÃO escreve no cache de mensagens — apenas
 * devolve o texto para o composer popular o input (decisão de produto: a sugestão
 * é um rascunho editável, não uma mensagem enviada).
 */
export function useSuggestReply(conversationId: string) {
  return useMutation({
    mutationFn: () => suggestReply(conversationId),
  });
}

export type { Conversation, Message };
