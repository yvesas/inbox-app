import { logger } from "../lib/logger.js";
import { getLlmProvider } from "../llm/index.js";
import { loadKnowledgeBase } from "../knowledge-base/kb.js";
import { loadInboundContext } from "./context.js";
import { sendWhatsAppText } from "./delivery.js";
import { recordReply } from "./outbound.js";
import type { IncomingJob } from "../queue/queue.js";

/**
 * Processa um job da fila: carrega contexto, gera a resposta (OpenAI ou stub),
 * entrega via Meta e persiste. Mantido fora do worker.ts para ser testável sem
 * subir o consumer do BullMQ.
 *
 * Resiliência: qualquer erro (LLM ou entrega) é propagado; o BullMQ aplica
 * retry com backoff (config em queue.ts). A entrega ocorre ANTES de escrever no
 * banco, então falha de entrega dispara retry sem deixar resposta órfã.
 */

// Provedor escolhido uma vez no boot (OpenAI se houver chave; senão, stub).
export const provider = getLlmProvider();

export async function processIncoming(job: IncomingJob): Promise<void> {
  const { tenantId, conversationId, waMessageId } = job;
  const log = logger.child({ tenantId, conversationId, waMessageId, provider: provider.name });

  const ctx = await loadInboundContext(tenantId, waMessageId);
  if (!ctx) {
    log.warn("mensagem inbound não encontrada — job ignorado");
    return;
  }

  // Idempotência: reprocessamento (retry/reentrega) não gera resposta duplicada.
  if (ctx.inbound.status === "replied") {
    log.info("mensagem já respondida — job idempotente, ignorado");
    return;
  }

  const knowledgeBase = await loadKnowledgeBase();
  const reply = await provider.generateReply({
    userMessage: ctx.inbound.body,
    history: ctx.history,
    knowledgeBase,
  });

  const delivery = await sendWhatsAppText({ to: ctx.contactWaId, body: reply });

  await recordReply({
    tenantId,
    conversationId,
    inboundId: ctx.inbound.id,
    body: reply,
    waMessageId: delivery.waMessageId,
  });

  log.info("resposta gerada e entregue");
}
