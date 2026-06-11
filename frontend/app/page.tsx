import { ConnectionCheck } from "./connection-check";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Desafio Frontend — Inbox de Atendimento</h1>
      <p className="mt-2 text-neutral-600">
        Este é o ponto de partida. O backend já está conectado (veja{" "}
        <code className="rounded bg-neutral-100 px-1">lib/api.ts</code>). Sua missão é construir
        a interface do inbox de atendimento WhatsApp. Veja o <code className="rounded bg-neutral-100 px-1">README.md</code>.
      </p>

      <div className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-500">Verificação de conexão com a API</h2>
        <ConnectionCheck />
      </div>

      <ol className="mt-8 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
        <li>Lista de conversas (busca, não-lidas, última mensagem).</li>
        <li>Tela de chat (bolhas in/out, envio com update otimista).</li>
        <li>Botão &quot;Sugerir resposta com IA&quot; (chama <code>/ai/suggest</code>).</li>
        <li>Estados de loading, erro e vazio. Capricha na UX. 🚀</li>
      </ol>
    </main>
  );
}
