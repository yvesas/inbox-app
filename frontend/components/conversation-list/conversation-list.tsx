"use client";

import { useMemo, useState } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { useConversations, useMe } from "@/lib/queries";
import { ConversationItem } from "./conversation-item";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-neutral-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-neutral-900">Conversas</h1>
        <p className="text-xs text-neutral-500">
          {me.data ? `${me.data.name} · ${me.data.role}` : " "}
        </p>
        <div className="mt-3">
          <label htmlFor="conversation-search" className="sr-only">
            Buscar conversas
          </label>
          <input
            id="conversation-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone…"
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:bg-white"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && <ListSkeleton />}

        {isError && (
          <div className="p-4 text-sm text-red-600">
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
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-neutral-100">
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
