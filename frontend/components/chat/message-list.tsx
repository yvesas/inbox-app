"use client";

import { Fragment, useEffect, useRef } from "react";
import type { Message } from "@/lib/api";
import { MessageBubble } from "./message-bubble";
import { Skeleton } from "@/components/ui/skeleton";
import { dayKey, formatDateSeparator } from "@/lib/format";

/**
 * Área rolável das mensagens. Faz auto-scroll para o fim quando chega mensagem nova
 * (inclusive a otimista do próprio agente) e agrupa por dia com um separador.
 * A região é um `log` com `aria-live` para anunciar mensagens novas a leitores de tela.
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
      <div
        role="status"
        aria-busy="true"
        className="flex-1 space-y-3 overflow-y-auto chat-surface p-4"
      >
        <span className="sr-only">Carregando mensagens…</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={i % 2 ? "ml-auto h-12 w-1/2" : "h-12 w-2/3"} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-1 items-center justify-center chat-surface p-4 text-sm text-red-600"
      >
        Não foi possível carregar as mensagens.
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="flex flex-1 items-center justify-center chat-surface p-4 text-sm text-neutral-500">
        Nenhuma mensagem nesta conversa ainda.
      </div>
    );
  }

  let lastDay = "";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto chat-surface p-4">
      <ul
        role="log"
        aria-live="polite"
        aria-label="Mensagens da conversa"
        className="mx-auto max-w-4xl space-y-2"
      >
        {messages?.map((m) => {
          const day = dayKey(m.createdAt);
          const showSeparator = day !== lastDay;
          lastDay = day;
          return (
            <Fragment key={m.id}>
              {showSeparator && <DateSeparator iso={m.createdAt} />}
              <MessageBubble message={m} />
            </Fragment>
          );
        })}
      </ul>
      <div ref={endRef} />
    </div>
  );
}

/** Etiqueta central de dia ("Hoje", "Ontem" ou data por extenso). */
function DateSeparator({ iso }: { iso: string }) {
  return (
    <li className="flex justify-center py-2" aria-hidden>
      <span className="rounded-full bg-white px-3 py-1 text-xs text-neutral-500 shadow-sm">
        {formatDateSeparator(iso)}
      </span>
    </li>
  );
}
