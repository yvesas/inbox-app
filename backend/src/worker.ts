import "dotenv/config";
import { Worker } from "bullmq";
import { QUEUE_NAME, connection, type IncomingJob } from "./queue/queue.js";
import { logger } from "./lib/logger.js";
import { processIncoming, provider } from "./messaging/process-incoming.js";

/**
 * Worker que consome a fila e processa cada mensagem recebida (processo separado:
 * `npm run worker`). A lógica de processamento fica em messaging/process-incoming.ts
 * para ser testável sem subir o consumer.
 */
function main(): void {
  const worker = new Worker<IncomingJob>(QUEUE_NAME, (job) => processIncoming(job.data), {
    connection,
    concurrency: 5,
  });

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id }, "job concluído");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, attempts: job?.attemptsMade, err: err.message }, "job falhou");
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
