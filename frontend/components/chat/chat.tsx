"use client";

import { useConversations, useMessages } from "@/lib/queries";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { Composer } from "./composer";

/**
 * Painel direito: uma conversa aberta. Os metadados do contato (nome, telefone, cor)
 * vêm do cache de `useConversations` — sem refetch dedicado, evitando waterfall só
 * para o cabeçalho.
 */
export function Chat({ conversationId }: { conversationId: string }) {
  const { data: conversations } = useConversations();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const { data: messages, isLoading, isError } = useMessages(conversationId);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <ChatHeader conversation={conversation} />
      <MessageList messages={messages} isLoading={isLoading} isError={isError} />
      <Composer conversationId={conversationId} />
    </div>
  );
}
