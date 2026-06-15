"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Split view responsivo. No desktop, lista (esquerda) e chat (direita) convivem.
 * No mobile, mostra um painel por vez conforme a rota: em `/inbox` aparece a lista;
 * ao abrir `/inbox/[id]`, o chat ocupa a tela (o cabeçalho do chat traz o "voltar").
 *
 * Ler o segmento aqui (Client) mantém o layout que o envolve como Server Component.
 */
export function InboxShell({
  list,
  children,
}: {
  list: React.ReactNode;
  children: React.ReactNode;
}) {
  const chatOpen = useSelectedLayoutSegment() !== null;

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-neutral-900">
      <aside
        className={cn(
          "w-full shrink-0 border-r border-neutral-200 md:flex md:w-80 lg:w-96",
          chatOpen ? "hidden" : "flex",
        )}
      >
        {list}
      </aside>

      <section className={cn("min-w-0 flex-1", chatOpen ? "flex" : "hidden md:flex")}>
        {children}
      </section>
    </div>
  );
}
