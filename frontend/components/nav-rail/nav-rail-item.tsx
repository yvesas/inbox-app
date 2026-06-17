import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Item do nav rail: um ícone clicável com tooltip nativo e estado ativo. Apresentação
 * pura — quem decide o destino e o "ativo" é o `NavRail`. Renderiza um `<a>` (navegável)
 * quando há `href`; caso contrário um `<button>` desabilitado (item de vitrine do SaaS).
 */
export function NavRailItem({
  label,
  icon,
  href,
  active = false,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const classes = cn(
    "relative flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-colors",
    active
      ? "bg-green-500/15 text-green-400"
      : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
    disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-400",
  );

  const content = (
    <>
      {/* Indicador da seção ativa, à esquerda do rail. */}
      {active && (
        <span
          aria-hidden
          className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-green-400"
        />
      )}
      {icon}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        title={label}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" title={label} aria-label={label} disabled className={classes}>
      {content}
    </button>
  );
}
