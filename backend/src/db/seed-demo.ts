import "dotenv/config";
import { env } from "../config/env.js";
import { db, queryClient } from "./client.js";
import { contacts, conversations, messages } from "./schema.js";
import { getTenantByApiKey } from "../tenants/repo.js";

/**
 * Dados de demonstração para o inbox (usados pelas rotas /ui que o frontend consome).
 * Idempotente (UUIDs fixos + onConflictDoNothing). Roda depois do seed base.
 *
 * Mantido separado do `seed.ts` para não alterar a entrega mínima do backend —
 * é populado só no fluxo do monorepo unificado (Docker) ou via `npm run db:seed:demo`.
 */

const CONTACTS = [
  { id: "00000000-0000-4000-8000-0000000000c1", waId: "5511988887766", name: "Mariana Lopes" },
  { id: "00000000-0000-4000-8000-0000000000c2", waId: "5511977776655", name: "Rafael Augusto" },
  { id: "00000000-0000-4000-8000-0000000000c3", waId: "5511966665544", name: "Juliana Prado" },
];

const CONVERSATIONS = [
  {
    id: "00000000-0000-4000-8000-0000000000a1",
    contactId: CONTACTS[0]!.id,
    lastMessageAt: "2026-06-15T11:42:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000a2",
    contactId: CONTACTS[1]!.id,
    lastMessageAt: "2026-06-15T10:15:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000000a3",
    contactId: CONTACTS[2]!.id,
    lastMessageAt: "2026-06-15T09:50:00.000Z",
  },
];

const MESSAGES = [
  // Mariana — suporte (internet caiu)
  {
    convId: CONVERSATIONS[0]!.id,
    waMessageId: "wamid.demo-a1-1",
    direction: "in" as const,
    body: "Bom dia",
    createdAt: "2026-06-15T11:40:00.000Z",
  },
  {
    convId: CONVERSATIONS[0]!.id,
    waMessageId: "wamid.demo-a1-2",
    direction: "in" as const,
    body: "Minha internet caiu de novo agora de manhã",
    createdAt: "2026-06-15T11:42:00.000Z",
  },
  // Rafael — fatura (resolvido)
  {
    convId: CONVERSATIONS[1]!.id,
    waMessageId: "wamid.demo-a2-1",
    direction: "in" as const,
    body: "Oi, a segunda via do boleto não chegou",
    createdAt: "2026-06-15T10:05:00.000Z",
  },
  {
    convId: CONVERSATIONS[1]!.id,
    waMessageId: "wamid.demo-a2-2",
    direction: "out" as const,
    body: "Olá, Rafael! Já reenviei para o seu WhatsApp. Pode conferir?",
    createdAt: "2026-06-15T10:15:00.000Z",
  },
  // Juliana — planos (upgrade)
  {
    convId: CONVERSATIONS[2]!.id,
    waMessageId: "wamid.demo-a3-1",
    direction: "in" as const,
    body: "Queria fazer upgrade pro plano de 1 Gbps, como funciona?",
    createdAt: "2026-06-15T09:50:00.000Z",
  },
];

async function main(): Promise<void> {
  const tenant = await getTenantByApiKey(env.UI_TENANT_API_KEY);
  if (!tenant) {
    console.error(
      `Tenant de demo não encontrado (api key: ${env.UI_TENANT_API_KEY}). Rode "npm run db:seed" antes.`,
    );
    await queryClient.end();
    process.exit(1);
  }
  const tenantId = tenant.id;

  await db
    .insert(contacts)
    .values(CONTACTS.map((c) => ({ ...c, tenantId })))
    .onConflictDoNothing();

  await db
    .insert(conversations)
    .values(
      CONVERSATIONS.map((c) => ({
        id: c.id,
        tenantId,
        contactId: c.contactId,
        lastMessageAt: new Date(c.lastMessageAt),
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(messages)
    .values(
      MESSAGES.map((m) => ({
        tenantId,
        conversationId: m.convId,
        waMessageId: m.waMessageId,
        direction: m.direction,
        body: m.body,
        status: m.direction === "in" ? "received" : "sent",
        createdAt: new Date(m.createdAt),
      })),
    )
    .onConflictDoNothing();

  console.log(`seed-demo: ${CONVERSATIONS.length} conversas para o tenant ${tenant.name}.`);
  await queryClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
