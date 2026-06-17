"use client";

import { useMemo, useState } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { useConversations, useMe } from "@/lib/queries";
import { ConversationItem } from "./conversation-item";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon } from "@/components/ui/icons";

/**
 * Painel esquerdo: cabeçalho com o agente logado, busca client-side e a lista de
 * conversas. É Client porque tem estado (busca) e consome React Query com polling.
 * A conversa ativa é destacada lendo o segmento de rota do layout do inbox.
 */
export function ConversationList() {
  const me = useMe();
  const { data, isLoading, isError, refetch } = useConversations();
  const activeId = useSelectedLayoutSegment();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !data) return data ?? [];
    return data.filter(
      (c) =>
        c.contactName.toLowerCase().includes(q) ||
        c.contactPhone.includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [data, search]);

  const count = data?.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-neutral-200 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold text-neutral-900">Conversas</h1>
          {count > 0 && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
              {count}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-neutral-500">
          {me.data ? `${me.data.name} · ${me.data.role}` : " "}
        </p>
        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-neutral-400" />
          <label htmlFor="conversation-search" className="sr-only">
            Buscar conversas
          </label>
          <input
            id="conversation-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone…"
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-green-500 focus:bg-white"
          />
        </div>
      </header>

      <nav aria-label="Conversas" className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && <ListSkeleton />}

        {isError && (
          <div role="alert" className="p-4 text-sm text-red-600">
            <p>Não foi possível carregar as conversas.</p>
            <button
              onClick={() => void refetch()}
              className="mt-2 rounded-md border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">
            {search ? "Nenhuma conversa encontrada." : "Nenhuma conversa ainda."}
          </p>
        )}

        {!isError && filtered.length > 0 && (
          <ul className="divide-y divide-neutral-100">
            {filtered.map((c) => (
              <ConversationItem key={c.id} conversation={c} active={c.id === activeId} />
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul role="status" aria-busy="true" className="divide-y divide-neutral-100">
      <li className="sr-only">Carregando conversas…</li>
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
