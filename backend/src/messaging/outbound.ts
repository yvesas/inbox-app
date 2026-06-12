import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { conversations, messages } from "../db/schema.js";

interface RecordReplyParams {
  tenantId: string;
  conversationId: string;
  /** id da mensagem inbound que está sendo respondida. */
  inboundId: string;
  body: string;
  /** wamid da resposta, devolvido pela Meta (pode ser nulo). */
  waMessageId: string | null;
}

/**
 * Persiste a resposta (outbound) e marca a mensagem inbound como respondida,
 * numa única transação. Marcar a inbound como "replied" é o que garante a
 * idempotência no worker: um reprocessamento do mesmo job sai cedo.
 */
export async function recordReply(params: RecordReplyParams): Promise<void> {
  const { tenantId, conversationId, inboundId, body, waMessageId } = params;

  await db.transaction(async (tx) => {
    await tx.insert(messages).values({
      tenantId,
      conversationId,
      waMessageId,
      direction: "out",
      body,
      status: "sent",
    });

    await tx.update(messages).set({ status: "replied" }).where(eq(messages.id, inboundId));

    await tx
      .update(conversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  });
}
