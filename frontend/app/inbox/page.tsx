import { InboxIcon } from "@/components/ui/icons";

/**
 * Estado vazio do painel direito (nenhuma conversa selecionada). No mobile fica
 * oculto pela casca — lá a lista ocupa a tela inteira até abrir uma conversa.
 */
export default function InboxEmptyState() {
  return (
    <div className="chat-surface flex h-full w-full flex-col items-center justify-center gap-3 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl text-green-600 shadow-sm"
        aria-hidden
      >
        <InboxIcon />
      </div>
      <div>
        <p className="font-medium text-neutral-700">Nenhuma conversa selecionada</p>
        <p className="mt-1 text-sm text-neutral-500">
          Escolha uma conversa à esquerda para começar a atender.
        </p>
      </div>
    </div>
  );
}
