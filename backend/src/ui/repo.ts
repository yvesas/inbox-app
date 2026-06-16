import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { contacts, conversations, messages } from "../db/schema.js";
import { getTenantByApiKey } from "../tenants/repo.js";
import { env } from "../config/env.js";
import type { ChatTurn } from "../llm/types.js";

/**
 * Camada de dados das rotas /ui (BFF). Diferente da REST multi-tenant autenticada,
 * aqui servimos um único tenant de demonstração e adaptamos os shapes exatamente
 * para o que o frontend espera (contactName, avatarColor, unread, lastMessage…).
 */

// Paleta determinística para o avatar (a API não guarda cor; derivamos do id).
const AVATAR_COLORS = [
  "#25D366",
  "#34B7F1",
  "#9C27B0",
  "#FF9800",
  "#E91E63",
  "#00BCD4",
  "#8BC34A",
  "#F44336",
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] as string;
}

let demoTenantId: string | null = null;

/** Resolve (e memoiza) o tenant de demonstração servido pelas rotas /ui. */
export async function getDemoTenantId(): Promise<string | null> {
  if (demoTenantId) return demoTenantId;
  const tenant = await getTenantByApiKey(env.UI_TENANT_API_KEY);
  demoTenantId = tenant?.id ?? null;
  return demoTenantId;
}

export interface UiConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  avatarColor: string;
  unread: number;
  lastMessage: string;
  lastMessageAt: string;
}

/** Conversas do tenant no formato do frontend (com prévia e não-lidas). */
export async function listConversationsForUi(tenantId: string): Promise<UiConversation[]> {
  const convs = await db
    .select({
      id: conversations.id,
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      contactName: contacts.name,
      contactWaId: contacts.waId,
    })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .where(eq(conversations.tenantId, tenantId))
    .orderBy(desc(conversations.lastMessageAt));

  if (convs.length === 0) return [];

  // Uma query para todas as mensagens das conversas, agregadas em memória
  // (evita N+1; o volume da demo é pequeno).
  const ids = convs.map((c) => c.id);
  const msgs = await db
    .select({
      conversationId: messages.conversationId,
      direction: messages.direction,
      body: messages.body,
      status: messages.status,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(eq(messages.tenantId, tenantId), inArray(messages.conversationId, ids)))
    .orderBy(asc(messages.createdAt));

  const lastByConv = new Map<string, { body: string; createdAt: Date }>();
  const unreadByConv = new Map<string, number>();
  for (const m of msgs) {
    lastByConv.set(m.conversationId, { body: m.body, createdAt: m.createdAt });
    if (m.direction === "in" && m.status !== "replied") {
      unreadByConv.set(m.conversationId, (unreadByConv.get(m.conversationId) ?? 0) + 1);
    }
  }

  return convs.map((c) => {
    const last = lastByConv.get(c.id);
    const lastAt = c.lastMessageAt ?? last?.createdAt ?? c.createdAt;
    return {
      id: c.id,
      contactName: c.contactName ?? c.contactWaId,
      contactPhone: c.contactWaId,
      avatarColor: avatarColor(c.id),
      unread: unreadByConv.get(c.id) ?? 0,
      lastMessage: last?.body ?? "",
      lastMessageAt: lastAt.toISOString(),
    };
  });
}

export interface UiMessage {
  id: string;
  direction: "in" | "out";
  body: string;
  status: string;
  createdAt: string;
}

/** Mensagens de uma conversa no formato do frontend. */
export async function listMessagesForUi(
  tenantId: string,
  conversationId: string,
): Promise<UiMessage[]> {
  const rows = await db
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

  return rows.map((m) => ({
    id: m.id,
    direction: m.direction,
    body: m.body,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }));
}

/** Insere uma mensagem do atendente (outbound) e atualiza a conversa. */
export async function insertOutboundMessage(
  tenantId: string,
  conversationId: string,
  body: string,
): Promise<UiMessage> {
  const now = new Date();
  const rows = await db
    .insert(messages)
    .values({ tenantId, conversationId, direction: "out", body, status: "sent" })
    .returning({
      id: messages.id,
      direction: messages.direction,
      body: messages.body,
      status: messages.status,
      createdAt: messages.createdAt,
    });

  const row = rows[0];
  if (!row) throw new Error("falha ao inserir mensagem");

  await db
    .update(conversations)
    .set({ lastMessageAt: now, updatedAt: now })
    .where(eq(conversations.id, conversationId));

  return {
    id: row.id,
    direction: row.direction,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface SuggestContext {
  /** wa_id do contato (destinatário). */
  contactWaId: string;
  /** Última mensagem do cliente (a responder). */
  userMessage: string;
  /** Histórico anterior (mais antigo → mais novo), sem a última do cliente. */
  history: ChatTurn[];
}

/** Monta o contexto para a sugestão de IA a partir do histórico da conversa. */
export async function loadSuggestContext(
  tenantId: string,
  conversationId: string,
): Promise<SuggestContext | null> {
  const contactRows = await db
    .select({ waId: contacts.waId })
    .from(conversations)
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId)))
    .limit(1);

  const contact = contactRows[0];
  if (!contact) return null;

  const rows = await db
    .select({ direction: messages.direction, body: messages.body })
    .from(messages)
    .where(and(eq(messages.tenantId, tenantId), eq(messages.conversationId, conversationId)))
    .orderBy(asc(messages.createdAt));

  const turns: ChatTurn[] = rows.map((m) => ({
    role: m.direction === "out" ? "assistant" : "user",
    content: m.body,
  }));

  // A "mensagem atual" é a última do cliente; o resto vira histórico.
  const lastInboundIdx = [...rows].map((m) => m.direction).lastIndexOf("in");
  const userMessage = lastInboundIdx >= 0 ? (rows[lastInboundIdx]?.body ?? "") : "";
  const history = lastInboundIdx >= 0 ? turns.slice(0, lastInboundIdx) : turns;

  return { contactWaId: contact.waId, userMessage, history };
}
