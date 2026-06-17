import { cn } from "@/lib/cn";
import { SparklesIcon } from "@/components/ui/icons";

/**
 * Botão "Sugerir resposta com IA". Apenas dispara a sugestão e sinaliza o loading;
 * quem decide o que fazer com o texto é o composer (popular o input).
 */
export function SuggestButton({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label="Sugerir resposta com IA"
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700",
        "hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <SparklesIcon className="text-base" />
      {loading ? "Gerando…" : "Sugerir com IA"}
    </button>
  );
}
