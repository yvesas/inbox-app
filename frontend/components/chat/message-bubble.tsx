import type { Message } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";

const STATUS_LABEL: Record<Message["status"], string> = {
  sent: "Enviada",
  delivered: "Entregue",
  read: "Lida",
};

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
        <span
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            isOut ? "text-green-100" : "text-neutral-400",
          )}
        >
          <time dateTime={message.createdAt} suppressHydrationWarning>
            {formatTime(message.createdAt)}
          </time>
          {isOut &&
            (pending ? (
              <span aria-label="Enviando">🕓</span>
            ) : (
              <span
                aria-label={STATUS_LABEL[message.status]}
                title={STATUS_LABEL[message.status]}
                className={cn(message.status === "read" && "text-sky-300")}
              >
                {message.status === "sent" ? "✓" : "✓✓"}
              </span>
            ))}
        </span>
      </div>
    </li>
  );
}
