import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";

/**
 * Schema do banco (Drizzle ORM + PostgreSQL).
 *
 * Multi-tenancy: toda tabela de domínio carrega `tenant_id` e todo acesso filtra por ele.
 * Idempotência: índice ÚNICO (tenant_id, wa_message_id) em `messages`.
 */

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  // Chave de API usada pela REST (Authorization: Bearer <api_key>).
  apiKey: text("api_key").notNull().unique(),
  // phone_number_id da Meta — resolve o tenant no webhook.
  phoneNumberId: text("phone_number_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    waId: text("wa_id").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("contacts_tenant_wa_uniq").on(t.tenantId, t.waId)],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id),
  status: text("status").notNull().default("open"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    // id da mensagem na Meta (wamid...). Nulo em mensagens outbound geradas por nós.
    waMessageId: text("wa_message_id"),
    direction: text("direction", { enum: ["in", "out"] }).notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("received"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("messages_tenant_wamid_uniq").on(t.tenantId, t.waMessageId)],
);

export type Tenant = typeof tenants.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
