/**
 * Estado vazio do painel direito (nenhuma conversa selecionada). No mobile fica
 * oculto pela casca — lá a lista ocupa a tela inteira até abrir uma conversa.
 */
export default function InboxEmptyState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-50 text-center">
      <div className="text-4xl" aria-hidden>
        💬
      </div>
      <p className="text-sm text-neutral-500">Selecione uma conversa para começar.</p>
    </div>
  );
}
