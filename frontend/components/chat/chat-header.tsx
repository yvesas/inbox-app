import Link from "next/link";
import type { Conversation } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";

/** Cabeçalho do chat: voltar (mobile), avatar e dados do contato. */
export function ChatHeader({ conversation }: { conversation: Conversation | undefined }) {
  return (
    <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
      <Link
        href="/inbox"
        aria-label="Voltar para a lista de conversas"
        className="-ml-1 rounded p-1 text-neutral-500 hover:bg-neutral-100 md:hidden"
      >
        ←
      </Link>

      {conversation && (
        <>
          <Avatar name={conversation.contactName} color={conversation.avatarColor} size={36} />
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{conversation.contactName}</p>
            <p className="truncate text-xs text-neutral-500">{conversation.contactPhone}</p>
          </div>
        </>
      )}
    </header>
  );
}
