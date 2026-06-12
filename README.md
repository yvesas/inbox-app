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
