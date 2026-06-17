"use client";

import { useMe } from "@/lib/queries";
import { Avatar } from "@/components/ui/avatar";
import {
  BrandIcon,
  ContactsIcon,
  InboxIcon,
  ReportsIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import { NavRailItem } from "./nav-rail-item";

/**
 * Barra de navegação vertical (cara de SaaS), em slate escuro: marca no topo, seções
 * no meio e o agente logado embaixo. Só "Conversas" é funcional; as demais ficam como
 * vitrine (desabilitadas) — sinalizam o produto sem prometer rota inexistente.
 *
 * Client porque lê a rota ativa e o agente (React Query). Oculta no mobile, onde a
 * lista já ocupa a tela inteira.
 */
export function NavRail() {
  const me = useMe();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-16 shrink-0 flex-col items-center gap-1 bg-slate-900 py-3 text-slate-200 md:flex"
    >
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 text-2xl text-green-400">
        <BrandIcon />
        <span className="sr-only">Inbox de Atendimento</span>
      </div>

      <NavRailItem label="Conversas" href="/inbox" icon={<InboxIcon />} active />
      <NavRailItem label="Contatos" icon={<ContactsIcon />} disabled />
      <NavRailItem label="Relatórios" icon={<ReportsIcon />} disabled />
      <NavRailItem label="Configurações" icon={<SettingsIcon />} disabled />

      <div className="mt-auto pt-2">
        {me.data ? (
          <div title={`${me.data.name} · ${me.data.role}`}>
            <Avatar name={me.data.name} color="#22c55e" size={36} />
            <span className="sr-only">{me.data.name}</span>
          </div>
        ) : (
          <div className="h-9 w-9 rounded-full bg-slate-700" aria-hidden />
        )}
      </div>
    </nav>
  );
}
