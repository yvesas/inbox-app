"use client";

import { useState } from "react";
import { useSendMessage, useSuggestReply } from "@/lib/queries";
import { SuggestButton } from "@/components/ai/suggest-button";

/**
 * Composer: campo de texto + envio (optimistic) + sugestão de IA. A sugestão apenas
 * popula o input (rascunho editável), enquanto o envio dispara a mutation otimista.
 */
export function Composer({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState("");
  const send = useSendMessage(conversationId);
  const suggest = useSuggestReply(conversationId);

  function submit() {
    const body = text.trim();
    if (!body) return;
    send.mutate(body);
    setText(""); // otimista: limpa já; em erro, a mensagem volta pelo rollback do cache
  }

  function onSuggest() {
    suggest.mutate(undefined, {
      onSuccess: (res) => setText(res.suggestion),
    });
  }

  return (
    <div className="border-t border-neutral-200 bg-white px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <SuggestButton onClick={onSuggest} loading={suggest.isPending} />
        {suggest.isError && <span className="text-xs text-red-600">Falha ao gerar sugestão.</span>}
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="composer-input" className="sr-only">
          Escrever mensagem
        </label>
        <textarea
          id="composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia; Shift+Enter quebra linha.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Escreva uma mensagem…"
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      {send.isError && (
        <p className="mt-1 text-xs text-red-600">Não foi possível enviar. Tente novamente.</p>
      )}
    </div>
  );
}
