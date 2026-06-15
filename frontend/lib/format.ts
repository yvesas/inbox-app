/** Formatação de exibição (datas, iniciais). pt-BR. */

const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/** Hora (HH:mm) — usado nas bolhas do chat. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : time.format(d);
}

/**
 * Carimbo curto para a lista de conversas: hora se for hoje, "ontem", ou dd/mm.
 * Mantém a lista enxuta sem uma lib de datas.
 */
export function formatListStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000);

  if (dayDiff <= 0) return time.format(d);
  if (dayDiff === 1) return "ontem";
  return dayMonth.format(d);
}

/** Iniciais do contato para o avatar (até 2 letras). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
