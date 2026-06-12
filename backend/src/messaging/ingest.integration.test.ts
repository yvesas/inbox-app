import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { and, eq, inArray } from "drizzle-orm";
import { env } from "../config/env.js";
import { db, queryClient } from "../db/client.js";
import { contacts, conversations, messages, tenants } from "../db/schema.js";
import { ingestInbound } from "./ingest.js";
import { getConversationForTenant, listConversations } from "../conversations/repo.js";

/**
 * Testes de integração contra um Postgres real (o `db:migrate` precisa ter rodado).
 * Exercitam a idempotência de verdade (índice único + onConflictDoNothing) e o
 * isolamento por tenant — "testar a reentrega, não só assumir".
 *
 * São pulados automaticamente quando não há banco acessível, para que `npm test`
 * continue verde sem docker.
 */
async function dbReachable(): Promise<boolean> {
  const probe = postgres(env.DATABASE_URL, { max: 1, connect_timeout: 2, onnotice: () => {} });
  try {
    await probe`select 1`;
    return true;
  } catch {
    return false;
  } finally {
    await probe.end({ timeout: 1 });
  }
}

const available = await dbReachable();

const TENANT_A = "00000000-0000-0000-0000-00000000000a";
const TENANT_B = "00000000-0000-0000-0000-00000000000b";

describe.skipIf(!available)("ingestInbound (integração)", () => {
  beforeAll(async () => {
    await cleanup();
    await db.insert(tenants).values([
      { id: TENANT_A, name: "Tenant A", apiKey: "key-a-test", phoneNumberId: "phone-a-test" },
      { id: TENANT_B, name: "Tenant B", apiKey: "key-b-test", phoneNumberId: "phone-b-test" },
    ]);
  });

  afterAll(async () => {
    await cleanup();
    await queryClient.end({ timeout: 5 });
  });

  it("é idempotente: reentrega do mesmo wa_message_id não duplica nem reprocessa", async () => {
    const params = {
      tenantId: TENANT_A,
      waId: "5511999990000",
      name: "Ana",
      waMessageId: "wamid.DUP",
      body: "Olá",
    };

    const first = await ingestInbound(params);
    const second = await ingestInbound(params); // reentrega idêntica

    expect(first.isNew).toBe(true);
    expect(second.isNew).toBe(false);
    expect(second.conversationId).toBe(first.conversationId);

    const rows = await db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.tenantId, TENANT_A), eq(messages.waMessageId, "wamid.DUP")));
    expect(rows).toHaveLength(1); // uma única mensagem persistida
  });

  it("isola conversas por tenant: B não enxerga dados de A", async () => {
    const a = await ingestInbound({
      tenantId: TENANT_A,
      waId: "5511111110000",
      waMessageId: "wamid.A1",
      body: "sou do tenant A",
    });
    await ingestInbound({
      tenantId: TENANT_B,
      waId: "5512222220000",
      waMessageId: "wamid.B1",
      body: "sou do tenant B",
    });

    const convsB = await listConversations(TENANT_B);
    expect(convsB.every((c) => c.contactWaId !== "5511111110000")).toBe(true);

    // A conversa de A não é acessível pelo tenant B.
    const leaked = await getConversationForTenant(TENANT_B, a.conversationId);
    expect(leaked).toBeNull();

    // ...mas é acessível pelo próprio tenant A.
    const own = await getConversationForTenant(TENANT_A, a.conversationId);
    expect(own).not.toBeNull();
  });
});

async function cleanup(): Promise<void> {
  const ids = [TENANT_A, TENANT_B];
  await db.delete(messages).where(inArray(messages.tenantId, ids));
  await db.delete(conversations).where(inArray(conversations.tenantId, ids));
  await db.delete(contacts).where(inArray(contacts.tenantId, ids));
  await db.delete(tenants).where(inArray(tenants.id, ids));
}
