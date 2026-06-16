# inbox-app — Atendimento WhatsApp com IA

Monorepo com **dois projetos independentes**. Cada um roda e é testado **por conta própria** —
escolha o que quer rodar:

| Projeto | O que é | Rodar | Detalhes |
|---|---|---|---|
| **[`backend/`](./backend)** | API Node.js + TypeScript: webhook da Meta → fila → worker → OpenAI (ancorada numa base de conhecimento) → resposta. Multi-tenant, idempotente, observável. | precisa de **Docker** | [`backend/README.md`](./backend/README.md) |
| **[`frontend/`](./frontend)** | Inbox de atendimento em Next.js (App Router): lista, chat, envio com optimistic e sugestão de IA. | só **Node ≥20** | [`frontend/README.md`](./frontend/README.md) |

> Por padrão as duas partes são **independentes**: o `frontend/` fala com uma API hospedada (ou um
> mock local próprio), sem precisar do backend. Mas há também um **modo unificado em Docker** em que
> o frontend consome o backend deste repo (via as rotas `/ui`) — veja [🐳 Docker](#-docker).

---

## ⚡ Rodar rápido

Cada projeto tem seu próprio `package.json`. Rode os comandos **dentro da pasta do projeto**.

### Backend (`cd backend`) — requer Docker

```bash
docker compose up -d              # postgres, redis, mock-meta, mock-openai
npm install
cp .env.example .env              # funciona sem editar (cai no StubProvider, sem custo)
npm run db:migrate && npm run db:seed
npm run dev                       # API em http://localhost:8000
npm run worker                    # (outro terminal) consumidor da fila

# simular uma mensagem de cliente ponta a ponta:
curl -X POST localhost:8001/simulate/inbound \
  -H 'Content-Type: application/json' \
  -d '{"from":"5511999990000","text":"Quais os planos e precos?"}'
curl -s localhost:8001/sent       # vê a resposta entregue
```

Atalho: `npm run stack` sobe infra + migrate + seed + API + worker num comando.
Testes: `npm test`. Detalhes completos no [README do backend](./backend/README.md).

### Frontend (`cd frontend`) — só Node

```bash
npm install
cp .env.example .env.local         # já vem com a URL da API hospedada
npm run dev                        # http://localhost:3000 (redireciona para /inbox)
```

Build (deliverable): `npm run build`. E2E local (Playwright + mock): `npm run e2e`.
Detalhes completos no [README do frontend](./frontend/README.md).

---

## 🐳 Docker

Três formas de rodar em container, todas com **Docker** + **Docker Compose**:

### 1. Monorepo unificado (frontend consome o backend)

Da **raiz**, sobe tudo junto — Postgres, Redis, mock-meta, API, worker e frontend — com o
frontend consumindo o backend via as rotas **`/ui`** (um BFF que adapta o backend ao contrato
da inbox). Inclui dados de demonstração (seed).

```bash
docker compose up --build
# frontend:  http://localhost:3000   (consome http://localhost:8000/ui)
# API:       http://localhost:8000   ·   mock-meta: http://localhost:8001
```

> O `NEXT_PUBLIC_API_URL` é inlinado **no build** do frontend e aponta para `http://localhost:8000/ui`
> (precisa ser alcançável pelo navegador, não pela rede interna do Docker).

### 2. Só o backend, em Docker

```bash
cd backend
WEBHOOK_URL=http://api:8000/webhook docker compose --profile app up --build
# API :8000 · worker · infra. Sem o profile "app", sobe só a infra (e você roda a app no host).
```

### 3. Só o frontend, em Docker (com o mock local)

```bash
cd frontend
docker compose up --build           # inbox em :3000 consumindo o mock em :4000
```

## Estrutura

```
inbox-app/
  backend/    # API de atendimento (Node + TS, Fastify, Drizzle, BullMQ, OpenAI)
  frontend/   # inbox de atendimento (Next.js 15, React 19, React Query, Tailwind v4)
```

---

## Desenvolvimento (opcional — para contribuir)

O monorepo usa **Husky + lint-staged** (na raiz) para padronizar os commits. Ao clonar, instale
as dependências da raiz **uma vez** para ativar os git hooks:

```bash
npm install            # na raiz — instala husky e registra os hooks
cd backend && npm install
cd ../frontend && npm install
```

Hooks ativos:

- **pre-commit** — bloqueia arquivos `.env` no stage (exceto `.env.example`) e roda
  Prettier (`--write`) + ESLint (`--fix`) nos arquivos staged de cada app (via lint-staged).
- **pre-push** — roda `typecheck` no backend e no frontend.

Cada app tem sua própria config de Prettier/ESLint; o runner do lint-staged usa o ferramental
da app a que o arquivo pertence.

## Fluxo de trabalho (Git)

Histórico **incremental e real** — um commit por unidade lógica de trabalho, evitando um único
commit gigante no fim.

- **Branch por fase/feature**, a partir da `main`: `feat/<escopo>`, `fix/<escopo>`,
  `test/<escopo>`, `docs/<escopo>`, `chore/<escopo>`. Ex.: `feat/fase-2-worker-llm`.
- **Conventional Commits com escopo da app, em pt-BR**: `tipo(escopo): descrição no imperativo`.
  Escopo = `backend` ou `frontend`. Tipos: `feat`, `fix`, `test`, `chore`, `refactor`, `docs`.
  Ex.: `feat(backend): worker assíncrono com geração de resposta (LLM) e entrega via Meta`.
- **Pull Request + merge** ao concluir cada fase (merge commit, mantendo o histórico do PR).
- Após o merge, **remova a branch** (local e remota) para manter o repositório limpo.

### `main` protegida

A `main` tem branch protection no GitHub:

- merge só via **Pull Request** (sem push direto);
- **CI verde obrigatório** — os checks `backend (lint · typecheck · test · build)` e
  `frontend (lint · typecheck · build)` precisam passar, com a branch atualizada em relação à
  `main`, antes do merge;
- **force-push e deleção bloqueados**.
