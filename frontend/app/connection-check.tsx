"use client";

import { useQuery } from "@tanstack/react-query";
import { getConversations, getMe } from "@/lib/api";

export function ConnectionCheck() {
  const me = useQuery({ queryKey: ["me"], queryFn: getMe });
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: getConversations });

  if (me.isLoading || conversations.isLoading) {
    return <p className="mt-2 text-sm text-neutral-500">Conectando à API…</p>;
  }

  if (me.isError || conversations.isError) {
    return (
      <p className="mt-2 text-sm text-red-600">
        Não consegui conectar. Confira <code>NEXT_PUBLIC_API_URL</code> no seu <code>.env.local</code>.
      </p>
    );
  }

  return (
    <p className="mt-2 text-sm text-green-700">
      ✓ Conectado como <strong>{me.data?.name}</strong> — {conversations.data?.length} conversas carregadas.
    </p>
  );
}
