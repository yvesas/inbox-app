import type { Message } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";

/** Bolha de mensagem. `out` (agente) à direita/verde; `in` (cliente) à esquerda/branca. */
export function MessageBubble({ message }: { message: Message }) {
  const isOut = message.direction === "out";
  const pending = message.id.startsWith("optimistic-");

  return (
    <li className={cn("flex", isOut ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isOut
            ? "rounded-br-sm bg-green-600 text-white"
            : "rounded-bl-sm bg-white text-neutral-900",
          pending && "opacity-70",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <time
          dateTime={message.createdAt}
          suppressHydrationWarning
          className={cn(
            "mt-1 block text-right text-[10px]",
            isOut ? "text-green-100" : "text-neutral-400",
          )}
        >
          {formatTime(message.createdAt)}
          {isOut && pending && " · enviando…"}
        </time>
      </div>
    </li>
  );
}
