# Inbox de Atendimento WhatsApp — Frontend (Next.js)

> Inbox de atendimento ao cliente que consome uma API de mensagens: lista de conversas, chat,
> envio com **optimistic update** e **sugestão de IA**.

## ⚡ Quickstart

Pré-requisito único: **Node ≥ 20** (não precisa de Docker nem do backend deste repo).

```bash
npm install
cp .env.example .env.local       # já vem com a URL da API hospedada
npm run dev                      # http://localhost:3000 → redireciona para /inbox
```

Outros comandos úteis:

```bash
npm run build                    # build de produção (precisa passar limpo)
npm run typecheck                # tsc --noEmit
npm run e2e                      # E2E (Playwright) contra um mock local determinístico
```

> A app aponta para uma API hospedada por padrão (`.env.local`). Para rodar 100% offline, suba o
> mock incluído: `cd server && node local.mjs` e ajuste `NEXT_PUBLIC_API_URL=http://localhost:4000`.

---

## 🎯 Funcionalidades

1. **Lista de conversas** — contato, última mensagem, horário, indicador de não-lidas, busca/filtro.
2. **Tela de chat** — histórico de mensagens (bolhas separando cliente × atendente), timestamps.
3. **Envio de mensagem** — com **atualização otimista** (a mensagem aparece antes da confirmação).
4. **Sugerir resposta com IA** — botão que chama `/ai/suggest` e preenche o campo com a sugestão
   (a API faz o proxy da OpenAI; a chave nunca chega ao browser).
5. **Estados** — loading, erro e vazio bem tratados; acessibilidade.
6. **Live updates** — lista e chat sincronizados por polling com React Query.

---

## 🔌 API consumida

O cliente HTTP e os tipos vivem em [`lib/api.ts`](lib/api.ts). A URL base vem de
`NEXT_PUBLIC_API_URL`. Para rodar offline, há um mock local em [`server/`](server/README.md).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/me` | Perfil do atendente logado |
| GET | `/conversations` | Lista de conversas |
| GET | `/conversations/:id/messages` | Mensagens de uma conversa |
| POST | `/conversations/:id/messages` | Envia mensagem `{ text }` |
| POST | `/ai/suggest` | Sugestão da IA `{ conversationId }` |

---

## ✅ Implementação — decisões de arquitetura

Inbox de atendimento completo: lista de conversas com busca, chat com envio otimista, sugestão
de IA, estados de loading/erro/vazio, responsivo e com live updates por polling.

### Server vs Client (consciente)

- **Server Components** — o *shell*: `app/inbox/layout.tsx` (compõe a casca) e as páginas de rota
  (`inbox/page.tsx` estado vazio; `inbox/[conversationId]/page.tsx` resolve o param e delega).
  Não carregam JS de interação à toa.
- **Client Components** (`'use client'`) — tudo que tem estado/interação: a lista (busca + polling),
  o chat, o composer (envio + IA) e a casca responsiva (`InboxShell`, que lê o segmento de rota
  para alternar lista↔chat no mobile). A fronteira fica nas folhas, não no topo.

### Data fetching & estado (React Query)

- Hooks centralizados em **`lib/queries.ts`**; chaves em **`lib/query-keys.ts`** (invalidação
  consistente, sem strings soltas).
- **Optimistic update** no envio (`useSendMessage`): `onMutate` injeta a mensagem provisória no
  cache → `onError` faz rollback → `onSettled` invalida `messages` + `conversations` (reconcilia e
  atualiza a prévia da lista). O caminho de erro é tratado de propósito.
- **Sugestão de IA** (`useSuggestReply`): `useMutation` que **não** escreve no cache de mensagens —
  só devolve o texto para o composer (rascunho editável).
- **Sem waterfall**: o cabeçalho do chat reusa o contato do cache de `useConversations` em vez de
  um refetch dedicado.
- **Live updates**: polling com `refetchInterval` (conversas 8s, mensagens 5s) sincronizando lista
  e chat.

### Estrutura

```
app/inbox/{layout,page}.tsx + app/inbox/[conversationId]/page.tsx
components/{conversation-list, chat, ai, ui} + components/inbox-shell.tsx
lib/{api.ts, queries.ts, query-keys.ts, cn.ts, format.ts}
e2e/inbox.spec.ts + playwright.config.ts
```

### Testes E2E (Playwright)

Fluxo ponta a ponta versionado em `e2e/`, rodando **100% local e determinístico**: o Playwright
sobe o backend mock local (`server/local.mjs`, store em memória) e o Next apontado para ele
(`NEXT_PUBLIC_API_URL`), sem rede nem dados reais.

```bash
npm run e2e          # roda os specs (sobe mock + app automaticamente)
npm run e2e:ui       # modo interativo
npm run e2e:report   # abre o último relatório HTML
```

Cobre: listar conversas (ordem por última mensagem), busca, abrir conversa e ver o histórico,
**enviar com optimistic**, **sugestão de IA** populando o composer e o estado vazio. Fica **fora
do CI** de propósito (pipeline leve); roda sob demanda.

### O que faria com mais tempo

- Testes de unidade/componente (React Testing Library) cobrindo o optimistic e o rollback de erro.
- Prefetch on hover do item da lista; virtualização para listas muito longas.
- WebSocket/SSE no lugar do polling, se a API expusesse.

---

## 🧱 Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · @tanstack/react-query · Tailwind v4 ·
axios · Playwright (E2E).
