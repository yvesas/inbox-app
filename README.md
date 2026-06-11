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
