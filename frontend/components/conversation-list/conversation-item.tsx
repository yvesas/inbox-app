import Link from "next/link";
import type { Conversation } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { formatListStamp } from "@/lib/format";

/** Item da lista: avatar, nome, prévia da última mensagem, carimbo e badge de não-lidas. */
export function ConversationItem({
  conversation,
  active,
}: {
  conversation: Conversation;
  active: boolean;
}) {
  const { id, contactName, avatarColor, lastMessage, lastMessageAt, unread } = conversation;

  return (
    <li>
      <Link
        href={`/inbox/${id}`}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 border-l-2 px-4 py-3 transition-colors",
          "hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600",
          active ? "border-green-600 bg-neutral-100 hover:bg-neutral-100" : "border-transparent",
        )}
      >
        <Avatar name={contactName} color={avatarColor} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-medium text-neutral-900">{contactName}</span>
            <time
              dateTime={lastMessageAt}
              className="shrink-0 text-xs text-neutral-400"
              suppressHydrationWarning
            >
              {formatListStamp(lastMessageAt)}
            </time>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-neutral-500">{lastMessage}</span>
            {unread > 0 && (
              <span
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-medium text-white"
                aria-label={`${unread} não lidas`}
              >
                {unread}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
