# Desafio Técnico — Desenvolvedor(a) Frontend (Next.js)

> **Inbox de Atendimento WhatsApp com IA** — construa a interface; o backend já está pronto.

Bem-vindo(a)! Neste desafio você vai construir o **frontend** de um painel de atendimento via
WhatsApp, parecido com o que usamos no dia a dia. **O backend já está implementado e hospedado**
— você foca 100% na experiência, na arquitetura de componentes e nas decisões de frontend.

Não buscamos pixel-perfect. Buscamos entender **como você pensa** em Next.js: o que é Server
e o que é Client Component, como busca e sincroniza dados, como trata estados de carregamento
e erro, e como organiza o código.

---

## 🎯 O que você vai construir

Um app **Next.js (App Router)** que consome a API fornecida e entrega:

1. **Lista de conversas** — contato, última mensagem, horário, indicador de não-lidas, busca/filtro.
2. **Tela de chat** — histórico de mensagens (bolhas separando cliente × atendente), timestamps.
3. **Envio de mensagem** — com **atualização otimista** (a mensagem aparece antes da confirmação).
4. **Sugerir resposta com IA** — botão que chama `/ai/suggest` e preenche o campo com a sugestão
   (o backend faz o proxy da OpenAI; a chave nunca chega ao browser).
5. **Estados** — loading, erro e vazio bem tratados; acessibilidade básica.
6. **Atualização** — manter a lista e o chat atualizados (polling com React Query já é
   suficiente; soluções melhores são diferencial — explique sua escolha).

---

## 🔌 Backend fornecido

Você **não precisa** implementar nem rodar o backend — ele já está no ar.

**URL da API (já configurada para você):**

```
NEXT_PUBLIC_API_URL=https://8tymn68hp9.execute-api.us-east-1.amazonaws.com
```

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/me` | Perfil do atendente logado |
| GET | `/conversations` | Lista de conversas |
| GET | `/conversations/:id/messages` | Mensagens de uma conversa |
| POST | `/conversations/:id/messages` | Envia mensagem `{ text }` |
| POST | `/ai/suggest` | Sugestão da IA `{ conversationId }` |

O cliente HTTP e os tipos já vêm prontos em [`lib/api.ts`](lib/api.ts). Se preferir rodar o
backend localmente (offline), veja [`server/README.md`](server/README.md).

---

## 🚀 Como começar

```bash
# 1. Configure a URL da API (já vem preenchida com a URL hospedada)
cp .env.example .env.local

# 2. Instale e rode
npm install
npm run dev          # http://localhost:3000
```

Abra <http://localhost:3000> — a página inicial faz uma **verificação de conexão** com a API.
Se aparecer "✓ Conectado", está tudo pronto para você construir.

> O que já entregamos: projeto Next.js configurado (App Router, Tailwind, React Query, Axios),
> `lib/api.ts` tipado e um exemplo mínimo de chamada. **As telas são por sua conta.**

---

## 📤 Entrega

- Repositório Git com **histórico de commits real**.
- `README.md` próprio: como rodar, decisões de arquitetura, o que faria diferente com mais tempo.
- O app deve **buildar** (`npm run build`) sem erros.

---

## 🧮 Critérios de avaliação

| Critério | Peso | O que olhamos |
|----------|------|---------------|
| Arquitetura de componentes | 25% | Composição, reuso, Server vs Client Components conscientes |
| Data fetching & estado | 25% | React Query bem usado, cache/invalidação, sem waterfalls |
| UX & estados | 20% | Loading/erro/vazio, update otimista, responsividade, acessibilidade |
| Qualidade do código | 20% | Tipagem, organização, naming, legibilidade |
| Capricho & detalhes | 10% | Aquilo que faz parecer um produto de verdade |

---

## 📋 Regras

- **Prazo**: 5 dias corridos.
- **Stack obrigatória**: Next.js (App Router) + TypeScript. UI à sua escolha (Tailwind já configurado;
  pode usar shadcn/ui, etc.).
- Pode usar IA como assistente — mas **você precisa entender e defender cada decisão** na entrevista.

Boa sorte! 🚀
