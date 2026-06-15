import { cn } from "@/lib/cn";

/** Bloco de carregamento com shimmer. Base para os skeletons de lista e chat. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200", className)} />;
}
