# inbox-app

Monorepo do projeto: atendimento ao cliente via WhatsApp com IA.

São duas aplicações independentes:

- **[`backend/`](./backend)** — API em Node.js + TypeScript. Recebe mensagens via webhook
  (WhatsApp Cloud API da Meta), processa de forma assíncrona com OpenAI ancorado numa base
  de conhecimento e responde automaticamente. Detalhes em [`backend/README.md`](./backend/README.md).

- **[`frontend/`](./frontend)** — Inbox de atendimento em Next.js (App Router). Consome a API
  para listar conversas, exibir o chat, enviar mensagens e sugerir respostas com IA.
  Detalhes em [`frontend/README.md`](./frontend/README.md).

Cada aplicação tem seu próprio `package.json`, dependências e instruções de execução.

## Desenvolvimento

Este monorepo usa **Husky + lint-staged** (na raiz) para padronizar os commits. Ao clonar,
instale as dependências da raiz **uma vez** para ativar os git hooks:

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

Histórico **incremental e real** é critério de avaliação — um commit por unidade lógica de
trabalho, evitando um único commit gigante no fim.

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
- **CI verde obrigatório** — o check `backend (lint · typecheck · test · build)` precisa passar,
  com a branch atualizada em relação à `main`, antes do merge;
- **force-push e deleção bloqueados**.
