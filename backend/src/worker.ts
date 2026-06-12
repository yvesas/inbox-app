import "dotenv/config";
import { Worker } from "bullmq";
import { QUEUE_NAME, connection, type IncomingJob } from "./queue/queue.js";
import { logger } from "./lib/logger.js";
import { getLlmProvider } from "./llm/index.js";
import { loadKnowledgeBase } from "./knowledge-base/kb.js";
import { loadInboundContext } from "./messaging/context.js";
import { sendWhatsAppText } from "./messaging/delivery.js";
import { recordReply } from "./messaging/outbound.js";

/**
 * Worker que consome a fila e processa cada mensagem recebida.
 *
 * Fluxo por job:
 *   1. Carrega conversa, histórico e destinatário (loadInboundContext).
 *   2. Idempotência: se a inbound já foi respondida, sai cedo.
 *   3. Recupera a base de conhecimento e gera a resposta (OpenAI ou stub).
 *   4. Entrega via Meta API (mock) e persiste a outbound + marca a inbound.
 *
 * Resiliência: qualquer erro (LLM ou entrega) é propagado e o BullMQ aplica
 * retry com backoff exponencial (configurado em queue.ts: 3 tentativas).
 */

// Provedor escolhido uma vez no boot (OpenAI se houver chave; senão, stub).
const provider = getLlmProvider();

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

  // Entrega ANTES de qualquer escrita no banco: assim uma falha de entrega
  // dispara retry sem deixar resposta persistida sem ter sido enviada.
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

function main(): void {
  const worker = new Worker<IncomingJob>(QUEUE_NAME, (job) => processIncoming(job.data), {
    connection,
    concurrency: 5,
  });

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id }, "job concluído");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, attempts: job?.attemptsMade, err: err.message },
      "job falhou",
    );
  });

  logger.info(
    { queue: QUEUE_NAME, provider: provider.name },
    "worker iniciado — aguardando mensagens",
  );

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "encerrando worker");
    await worker.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main();
