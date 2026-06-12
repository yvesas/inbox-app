import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { contacts, conversations, messages } from "../db/schema.js";
import type { ChatTurn } from "../llm/types.js";

export interface InboundContext {
  inbound: { id: string; status: string; body: string };
  conversationId: string;
  /** wa_id do contato — destino do envio da resposta. */
  contactWaId: string;
  /** Histórico anterior da conversa (sem a mensagem atual), mais antigo → mais novo. */
  history: ChatTurn[];
}

/**
 * Carrega tudo que o worker precisa para responder a uma mensagem: a própria
 * mensagem inbound, o destinatário e o histórico anterior da conversa.
 * Todas as consultas filtram por tenant_id (isolamento multi-tenant).
 *
 * Retorna null se a mensagem não for encontrada para o tenant.
 */
export async function loadInboundContext(
  tenantId: string,
  waMessageId: string,
): Promise<InboundContext | null> {
  const inboundRows = await db
    .select({
      id: messages.id,
      status: messages.status,
      body: messages.body,
      conversationId: messages.conversationId,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(eq(messages.tenantId, tenantId), eq(messages.waMessageId, waMessageId)))
    .limit(1);

  const inbound = inboundRows[0];
  if (!inbound) return null;

  const contactRows = await db
    .select({ waId: contacts.waId })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .where(
      and(eq(conversations.id, inbound.conversationId), eq(conversations.tenantId, tenantId)),
    )
    .limit(1);

  const contact = contactRows[0];
  if (!contact) return null;

  const allMessages = await db
    .select({ id: messages.id, direction: messages.direction, body: messages.body })
    .from(messages)
    .where(
      and(
        eq(messages.tenantId, tenantId),
        eq(messages.conversationId, inbound.conversationId),
      ),
    )
    .orderBy(asc(messages.createdAt));

  // Histórico = tudo menos a mensagem atual; in → user, out → assistant.
  const history: ChatTurn[] = allMessages
    .filter((m) => m.id !== inbound.id)
    .map((m) => ({ role: m.direction === "out" ? "assistant" : "user", content: m.body }));

  return {
    inbound: { id: inbound.id, status: inbound.status, body: inbound.body },
    conversationId: inbound.conversationId,
    contactWaId: contact.waId,
    history,
  };
}
