import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { contacts, conversations, messages } from "../db/schema.js";

interface IngestInboundParams {
  tenantId: string;
  waId: string;
  name?: string | undefined;
  waMessageId: string;
  body: string;
}

interface IngestResult {
  conversationId: string;
  /** false quando a mensagem já havia sido processada (reentrega da Meta). */
  isNew: boolean;
}

/**
 * Persiste uma mensagem inbound de forma idempotente.
 * Reentrega do mesmo wa_message_id não duplica nem reprocessa.
 */
export async function ingestInbound(params: IngestInboundParams): Promise<IngestResult> {
  const { tenantId, waId, name, waMessageId, body } = params;

  // 1. Contato (upsert por tenant + wa_id)
  const contactId = await upsertContact(tenantId, waId, name);

  // 2. Conversa aberta (reaproveita ou cria)
  const conversationId = await getOrCreateOpenConversation(tenantId, contactId);

  // 3. Mensagem inbound — idempotente via índice único (tenant_id, wa_message_id)
  const inserted = await db
    .insert(messages)
    .values({
      tenantId,
      conversationId,
      waMessageId,
      direction: "in",
      body,
      status: "received",
    })
    .onConflictDoNothing({ target: [messages.tenantId, messages.waMessageId] })
    .returning({ id: messages.id });

  const isNew = inserted.length > 0;

  if (isNew) {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  return { conversationId, isNew };
}

async function upsertContact(
  tenantId: string,
  waId: string,
  name?: string | undefined,
): Promise<string> {
  const inserted = await db
    .insert(contacts)
    .values({ tenantId, waId, name: name ?? null })
    .onConflictDoNothing({ target: [contacts.tenantId, contacts.waId] })
    .returning({ id: contacts.id });

  const first = inserted[0];
  if (first) return first.id;

  // Já existia: busca o id.
  const existing = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.tenantId, tenantId), eq(contacts.waId, waId)))
    .limit(1);

  const row = existing[0];
  if (!row) throw new Error("contato não encontrado após upsert");
  return row.id;
}

async function getOrCreateOpenConversation(tenantId: string, contactId: string): Promise<string> {
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.tenantId, tenantId),
        eq(conversations.contactId, contactId),
        eq(conversations.status, "open"),
      ),
    )
    .limit(1);

  const found = existing[0];
  if (found) return found.id;

  const created = await db
    .insert(conversations)
    .values({ tenantId, contactId, status: "open", lastMessageAt: new Date() })
    .returning({ id: conversations.id });

  const row = created[0];
  if (!row) throw new Error("falha ao criar conversa");
  return row.id;
}
