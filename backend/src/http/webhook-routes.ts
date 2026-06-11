import type { FastifyInstance, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { verifyMetaSignature } from "../lib/signature.js";
import { metaWebhookSchema } from "../webhook/meta-schema.js";
import { getTenantByPhoneNumberId } from "../tenants/repo.js";
import { ingestInbound } from "../messaging/ingest.js";
import { incomingQueue } from "../queue/queue.js";

export async function registerWebhookRoutes(app: FastifyInstance) {
  // Handshake de verificação da Meta.
  app.get("/webhook", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
      return reply.code(200).send(challenge);
    }
    return reply.code(403).send({ error: "verification_failed" });
  });

  // Recebimento de mensagens.
  app.post("/webhook", async (req: FastifyRequest, reply) => {
    // 1. Assinatura HMAC sobre o raw body.
    const signature = req.headers["x-hub-signature-256"];
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    if (!verifyMetaSignature(rawBody, signature as string | undefined, env.META_APP_SECRET)) {
      logger.warn("webhook com assinatura inválida");
      return reply.code(403).send({ error: "invalid_signature" });
    }

    // 2. Validação do payload.
    const parsed = metaWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, "payload de webhook inválido");
      // 200 para a Meta não reenviar indefinidamente um payload malformado.
      return reply.code(200).send({ received: true });
    }

    // 3. Processa cada mensagem (persistência idempotente + enfileiramento).
    //    Responde 200 rápido; OpenAI/entrega ficam para o worker.
    for (const entry of parsed.data.entry) {
      for (const change of entry.changes) {
        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId || !value.messages?.length) continue;

        const tenant = await getTenantByPhoneNumberId(phoneNumberId);
        if (!tenant) {
          logger.warn({ phoneNumberId }, "tenant não encontrado para phone_number_id");
          continue;
        }

        for (const message of value.messages) {
          if (message.type !== "text" || !message.text) continue;

          const contact = value.contacts?.find((c) => c.wa_id === message.from);
          const result = await ingestInbound({
            tenantId: tenant.id,
            waId: message.from,
            name: contact?.profile?.name,
            waMessageId: message.id,
            body: message.text.body,
          });

          const log = logger.child({
            tenantId: tenant.id,
            conversationId: result.conversationId,
            waMessageId: message.id,
          });

          if (!result.isNew) {
            log.info("mensagem duplicada (reentrega) — ignorada");
            continue;
          }

          await incomingQueue.add("process", {
            tenantId: tenant.id,
            conversationId: result.conversationId,
            waMessageId: message.id,
          });
          log.info("mensagem recebida e enfileirada");
        }
      }
    }

    return reply.code(200).send({ received: true });
  });
}
