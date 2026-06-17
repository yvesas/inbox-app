"use client";

import { cn } from "@/lib/cn";

/**
 * Handle de arrasto entre dois painéis. É só apresentação + alvo de interação: recebe
 * os `separatorProps` (de `useResizablePanel`) já com semântica de `role="separator"`,
 * teclado e ARIA. A área clicável é generosa; a linha visível, discreta. Some no mobile.
 */
export function ResizeHandle({ className, ...separatorProps }: React.ComponentProps<"div">) {
  return (
    <div
      {...separatorProps}
      className={cn(
        "group relative hidden w-1.5 shrink-0 cursor-col-resize md:block",
        "outline-none",
        className,
      )}
    >
      {/* Linha central que reage a hover/foco/arrasto. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-neutral-200 transition-colors",
          "group-hover:bg-green-500 group-focus-visible:bg-green-600",
        )}
      />
    </div>
  );
}
