import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { contacts, conversations, messages } from "../db/schema.js";

/** Lista conversas do tenant, com dados do contato e prévia da última mensagem. */
export async function listConversations(tenantId: string) {
  return db
    .select({
      id: conversations.id,
      status: conversations.status,
      lastMessageAt: conversations.lastMessageAt,
      contactName: contacts.name,
      contactWaId: contacts.waId,
    })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .where(eq(conversations.tenantId, tenantId))
    .orderBy(desc(conversations.lastMessageAt));
}

/** Garante que a conversa pertence ao tenant antes de expor as mensagens. */
export async function getConversationForTenant(tenantId: string, conversationId: string) {
  const rows = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listMessages(tenantId: string, conversationId: string) {
  return db
    .select({
      id: messages.id,
      direction: messages.direction,
      body: messages.body,
      status: messages.status,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(eq(messages.tenantId, tenantId), eq(messages.conversationId, conversationId)))
    .orderBy(asc(messages.createdAt));
}
