"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/api";
import { MessageBubble } from "./message-bubble";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Área rolável das mensagens. Faz auto-scroll para o fim quando chega mensagem nova
 * (inclusive a otimista do próprio agente) — comportamento esperado de um chat.
 */
export function MessageList({
  messages,
  isLoading,
  isError,
}: {
  messages: Message[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages?.length ?? 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={i % 2 ? "ml-auto h-12 w-1/2" : "h-12 w-2/3"} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-red-600">
        Não foi possível carregar as mensagens.
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-neutral-500">
        Nenhuma mensagem nesta conversa ainda.
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50 p-4">
      <ul className="space-y-2">
        {messages?.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </ul>
      <div ref={endRef} />
    </div>
  );
}
