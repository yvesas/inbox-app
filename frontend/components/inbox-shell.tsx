"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/cn";
import { useResizablePanel } from "@/lib/hooks/use-resizable-panel";
import { NavRail } from "@/components/nav-rail/nav-rail";
import { ResizeHandle } from "@/components/ui/resize-handle";

const LIST_MIN = 260;
const LIST_MAX = 480;
const LIST_DEFAULT = 340;

/**
 * Casca do produto: nav rail (esquerda) + painel de conversas redimensionável + chat.
 * No desktop os três convivem; a largura da lista é arrastável (handle entre lista e
 * chat) e persistida. No mobile, o rail some e mostra-se um painel por vez conforme a
 * rota — em `/inbox` a lista; ao abrir `/inbox/[id]`, o chat ocupa a tela.
 *
 * A largura arrastada vai por CSS var (`--list-w`) e só vale a partir de `md:`, deixando
 * o mobile em largura total sem que o estilo inline atropele o responsivo.
 */
export function InboxShell({
  list,
  children,
}: {
  list: React.ReactNode;
  children: React.ReactNode;
}) {
  const chatOpen = useSelectedLayoutSegment() !== null;
  const { width, separatorProps } = useResizablePanel({
    min: LIST_MIN,
    max: LIST_MAX,
    initial: LIST_DEFAULT,
    storageKey: "inbox:list-width",
  });

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-neutral-50 text-neutral-900">
      <NavRail />

      <aside
        style={{ "--list-w": `${width}px` } as React.CSSProperties}
        className={cn(
          "w-full shrink-0 flex-col border-r border-neutral-200 bg-white md:flex md:w-[var(--list-w)]",
          chatOpen ? "hidden" : "flex",
        )}
      >
        {list}
      </aside>

      <ResizeHandle {...separatorProps} />

      <section className={cn("min-w-0 flex-1", chatOpen ? "flex" : "hidden md:flex")}>
        {children}
      </section>
    </div>
  );
}
