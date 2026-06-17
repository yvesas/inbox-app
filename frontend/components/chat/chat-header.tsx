import Link from "next/link";
import type { Conversation } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeftIcon } from "@/components/ui/icons";

/** Cabeçalho do chat: voltar (mobile), avatar e dados do contato. */
export function ChatHeader({ conversation }: { conversation: Conversation | undefined }) {
  return (
    <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
      <Link
        href="/inbox"
        aria-label="Voltar para a lista de conversas"
        className="-ml-1 rounded-lg p-1.5 text-lg text-neutral-500 hover:bg-neutral-100 md:hidden"
      >
        <ArrowLeftIcon />
      </Link>

      {conversation && (
        <>
          <div className="relative shrink-0">
            <Avatar name={conversation.contactName} color={conversation.avatarColor} size={40} />
            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"
              aria-label="Online"
              title="Online"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{conversation.contactName}</p>
            <p className="truncate text-xs text-neutral-500">{conversation.contactPhone}</p>
          </div>
        </>
      )}
    </header>
  );
}
