# inbox-backend — Atendimento WhatsApp com IA (NeoFibra)

Backend que recebe mensagens de WhatsApp (formato **Meta Cloud API**), processa de forma
**assíncrona** e responde com uma **LLM ancorada numa base de conhecimento**, de volta pelo
mock da Meta. Multi-tenant, idempotente e observável.

> API de atendimento ao cliente via WhatsApp com IA (Node.js + TypeScript).

---

## ⚡ Quickstart

Pré-requisitos: **Node ≥ 20** e **Docker**. Rode tudo a partir desta pasta (`backend/`).
**Não precisa de chave da OpenAI** — sem ela, o fluxo roda ponta a ponta com um stub
determinístico (ou com o `mock-openai` do compose).

```bash
docker compose up -d                 # postgres, redis, mock-meta, mock-openai
npm install
cp .env.example .env                 # funciona sem editar
npm run db:migrate && npm run db:seed
npm run stack                        # sobe API (:8000) + worker juntos, com logs rotulados
```

Em outro terminal, simule uma mensagem de cliente e veja a resposta entregue:

```bash
curl -X POST localhost:8001/simulate/inbound \
  -H 'Content-Type: application/json' \
  -d '{"from":"5511999990000","text":"Quais os planos e precos?"}'
curl -s localhost:8001/sent
```

Testes: `npm test` (verde sem Docker; com Docker, roda também as integrações). Detalhes,
decisões e variantes (API+worker em terminais separados, IA real) nas seções abaixo.

> Se preferir subir API e worker separadamente, use `npm run dev` e `npm run worker` em vez de
> `npm run stack`. Tudo explicado em **[Como rodar (do zero)](#como-rodar-do-zero)**.

---

## Fluxo

```
Meta (mock)  ──POST /webhook (assinado HMAC)──►  API (Fastify)
                                                   │  valida assinatura (raw body)
                                                   │  persiste inbound (idempotente)
                                                   │  responde 200  ──┐  (sem LLM aqui)
                                                   └─ enfileira job ──►  Redis / BullMQ
                                                                          │
                                                            Worker (processo separado)
                                                              │ monta contexto (histórico + KB)
                                                              │ gera resposta (OpenAI ou Stub)
                                                              │ entrega ► POST {meta}/{id}/messages
                                                              └ persiste outbound + marca inbound
```

O webhook responde **200 imediatamente**; toda chamada à LLM e a entrega acontecem **no worker**.

---

## Stack e por quê

| Camada | Escolha | Motivo |
|---|---|---|
| HTTP | **Fastify** | Performance e captura simples do **raw body** (necessário para o HMAC). |
| Banco | **PostgreSQL + Drizzle ORM** (postgres-js) | Tipagem forte, migrations versionadas; já no compose. |
| Fila | **BullMQ + Redis** | Retry/backoff nativos; processo de worker separado. |
| LLM | **OpenAI** (`gpt-4o-mini`) atrás de uma interface | Troca por um stub determinístico sem chave (ver abaixo). |
| Validação | **Zod** | Valida o envelope do webhook e as variáveis de ambiente. |
| Logs | **Pino** | Logging estruturado por conversa (observabilidade). |
| Testes | **Vitest** | Unitários + integração. |

---

## Como rodar (do zero)

Pré-requisitos: **Node ≥ 20**, **Docker**. Rode os comandos a partir de `backend/`.

```bash
# 1. Infra (Postgres :5432, Redis :6379, mock-meta :8001)
docker compose up -d

# 2. Dependências
npm install

# 3. Ambiente
cp .env.example .env          # funciona sem editar (ver "Sem token OpenAI" abaixo)

# 4. Banco
npm run db:migrate
npm run db:seed               # cria o tenant de dev NeoFibra (api key: dev-api-key-neofibra)

# 5. Suba a API e o worker (dois terminais)
npm run dev                   # API em http://localhost:8000
npm run worker                # consumidor da fila

# 6. Simule uma mensagem de cliente (o mock assina e chama o /webhook)
curl -X POST localhost:8001/simulate/inbound \
  -H 'Content-Type: application/json' \
  -d '{"from":"5511999990000","text":"Quais os planos e precos?"}'

# 7. Veja a resposta entregue
curl -s localhost:8001/sent
```

### Sem token da OpenAI

A integração com a LLM fica **atrás da interface `LlmProvider`**. Em runtime, `getLlmProvider()`
escolhe:

- **`OpenAiProvider`** quando há uma `OPENAI_API_KEY` válida (`gpt-4o-mini`, temperatura baixa);
- **`StubProvider`** (determinístico, sem custo) caso contrário — faz um retrieval léxico na
  base de conhecimento e responde ancorado nela, mantendo a postura anti-alucinação.

Assim o fluxo roda **ponta a ponta sem chave** e os testes não dependem da OpenAI. Para usar a
IA real, basta preencher `OPENAI_API_KEY` no `.env`.

**Exercitar o caminho da IA offline** (sem custo): o `docker compose` inclui um **`mock-openai`**
(API compatível com Chat Completions). Aponte o backend para ele no `.env` e o `OpenAiProvider`
roda contra o fake:

```env
OPENAI_BASE_URL=http://localhost:8002/v1
OPENAI_API_KEY=fake-key
```

### Atalho: subir tudo com um comando

```bash
npm run stack   # infra (docker) + migrate + seed + API + worker, com logs rotulados
```

---

## Variáveis de ambiente

Todas validadas por Zod em `src/config/env.ts` (falha no boot se faltar algo essencial). Ver
`.env.example`. Principais: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY` (opcional),
`OPENAI_MODEL`, `META_VERIFY_TOKEN`, `META_APP_SECRET`, `META_TOKEN`, `META_API_BASE_URL`,
`META_PHONE_NUMBER_ID`, `PORT`, `LOG_LEVEL`.

---

## Decisões de arquitetura

- **Camadas e fronteiras** — `http/` (rotas + auth), `messaging/` (ingest, contexto, entrega,
  outbound, processamento), `llm/` (provider/prompt), `queue/`, `db/`, `knowledge-base/`. O
  handler do webhook não faz trabalho pesado.
- **Fluxo assíncrono** — o webhook valida, persiste e enfileira; responde 200 em milissegundos.
  OpenAI/entrega só no worker.
- **Segurança (HMAC)** — `X-Hub-Signature-256` validado sobre o **corpo cru** (preservado em
  `http/app.ts` via `addContentTypeParser`), com comparação em tempo constante.
- **Idempotência** — índice **único `(tenant_id, wa_message_id)`** + `onConflictDoNothing` no
  insert da inbound; o webhook só enfileira quando a mensagem é nova. No worker, há ainda um
  guard que sai cedo se a inbound já foi respondida.
- **Multi-tenancy** — tenant resolvido pelo `phone_number_id` (webhook) ou pela **API key**
  (`Authorization: Bearer …` na REST); **toda** query filtra `tenant_id`.
- **Resiliência** — retry/backoff exponencial nativo do BullMQ. A **entrega ocorre antes** de
  qualquer escrita no banco: falha de entrega dispara retry sem deixar resposta órfã.
  (Trade-off consciente: entrega *at-least-once* — num cenário raro de falha após entregar e
  antes de persistir, pode haver reenvio.)
- **Anti-alucinação** — system prompt ancorado na KB com instrução explícita de admitir quando
  a informação não está na base, em vez de inventar.

---

## API REST

Autenticação por tenant: `Authorization: Bearer <api_key>` (ou `x-api-key`).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Healthcheck. |
| GET | `/webhook` | Handshake de verificação da Meta. |
| POST | `/webhook` | Recebimento de mensagens (HMAC). |
| GET | `/conversations` | Conversas do tenant autenticado. |
| GET | `/conversations/:id/messages` | Mensagens de uma conversa (do tenant). |

```bash
curl localhost:8000/conversations -H 'Authorization: Bearer dev-api-key-neofibra'
```

---

## Testes

```bash
npm test          # vitest
npm run typecheck
```

**47 testes** (unitários + integração). Cobrem:

- **HMAC** válido/inválido/adulterado (`lib/signature`);
- **Parse** do webhook com Zod (`webhook/meta-schema`);
- **Entrega** no formato Meta e *throw* em falha para acionar o retry (`messaging/delivery`);
- **Seleção de provedor** (`getLlmProvider`: stub sem chave, OpenAI com chave válida ou com
  baseURL fake) e **OpenAiProvider** com a SDK mockada — montagem da chamada e parsing (`llm/*`);
- **Worker**: idempotência (sai cedo se já respondido) e propagação de erro (`process-incoming`);
- **Rota do webhook** via `app.inject`: 403 em assinatura inválida, enfileiramento de mensagem
  nova, **dedupe idempotente** em reentrega e **isolamento multi-tenant** (`http/webhook-routes`);
- **REST de conversas** e carregamento da **KB** (`http/conversation-routes`, `knowledge-base/kb`).

Três suítes de **integração** rodam contra dependências reais e são **puladas automaticamente
quando o serviço não está no ar** — `npm test` fica verde sem docker e roda de verdade com
`docker compose up`:

- **Postgres real** — idempotência por reentrega e isolamento por tenant (`messaging/ingest.integration`);
- **Redis + BullMQ real** — o worker recebe o payload enfileirado e o **retry/backoff** reprocessa
  um job que falha (`queue/queue.integration`);
- **mock-openai real** — o `OpenAiProvider` fala HTTP de verdade com a API compatível e faz o
  parsing da resposta, exercitando o caminho da IA offline (`llm/openai-provider.integration`).

Os testes não dependem da OpenAI real (usam `StubProvider`, mocks ou o mock-openai).

---

## Observabilidade

Logs estruturados com Pino. No fluxo de mensagem, cada log carrega
`tenantId` / `conversationId` / `waMessageId`, permitindo rastrear um atendimento específico.

---

## Premissas

- Apenas mensagens de **texto** são processadas; outros tipos são ignorados com segurança.
- A KB é pequena (~3,5 KB) → injetada como **contexto direto** no prompt (sem RAG vetorial),
  o que é mais simples e confiável para esse volume.
- O `mock-meta` substitui a Meta real; com credenciais reais, basta apontar `META_API_BASE_URL`.

---

## Deixado para depois (e por quê)

- **Function calling** (ex.: consultar status de pedido num endpoint mock) — bônus; o foco foi
  arquitetura, async, segurança e idempotência.
- **Paginação/filtros** na REST — fora do escopo mínimo.
- **RAG vetorial** — desnecessário para o tamanho atual da base.
- **Dead-letter queue / métricas** — o retry/backoff do BullMQ cobre o essencial por enquanto.

---

## Estrutura

```
src/
  config/env.ts          # env validado (Zod)
  db/                    # schema (Drizzle), client, seed
  http/                  # app (raw body p/ HMAC), auth, rotas (webhook, conversations)
  lib/                   # signature (HMAC), logger (Pino)
  messaging/             # ingest, context, delivery, outbound, process-incoming
  llm/                   # provider (OpenAI | Stub), prompt, tipos
  knowledge-base/        # carregamento da KB
  queue/                 # fila BullMQ
  index.ts               # API
  worker.ts              # consumidor da fila
knowledge-base/          # base de conhecimento (NeoFibra)
mock-meta-server/        # mock da Meta (incluído)
```
