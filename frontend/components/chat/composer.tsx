"use client";

import { useRef, useState } from "react";
import { useSendMessage, useSuggestReply } from "@/lib/queries";
import { useAutosizeTextarea } from "@/lib/hooks/use-autosize-textarea";
import { SuggestButton } from "@/components/ai/suggest-button";
import { SendIcon } from "@/components/ui/icons";

/**
 * Composer: campo de texto que cresce com o conteúdo + envio (optimistic) + sugestão
 * de IA. A sugestão apenas popula o input (rascunho editável); o envio dispara a
 * mutation otimista. O auto-resize fica num hook dedicado (SRP) — aqui só orquestra.
 */
export function Composer({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const send = useSendMessage(conversationId);
  const suggest = useSuggestReply(conversationId);

  useAutosizeTextarea(inputRef, text);

  function submit() {
    const body = text.trim();
    if (!body) return;
    send.mutate(body);
    setText(""); // otimista: limpa já; em erro, a mensagem volta pelo rollback do cache
  }

  function onSuggest() {
    suggest.mutate(undefined, {
      onSuccess: (res) => {
        setText(res.suggestion);
        inputRef.current?.focus();
      },
    });
  }

  return (
    <div className="border-t border-neutral-200 bg-white px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <SuggestButton onClick={onSuggest} loading={suggest.isPending} />
        {suggest.isError && <span className="text-xs text-red-600">Falha ao gerar sugestão.</span>}
      </div>

      <form
        className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 transition-colors focus-within:border-green-500 focus-within:bg-white"
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
          ref={inputRef}
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
          className="max-h-48 min-h-[44px] flex-1 resize-none self-stretch bg-transparent px-2 py-2 text-sm leading-relaxed outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Enviar mensagem"
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendIcon className="text-base" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>

      {send.isError && (
        <p className="mt-1 text-xs text-red-600">Não foi possível enviar. Tente novamente.</p>
      )}
    </div>
  );
}
