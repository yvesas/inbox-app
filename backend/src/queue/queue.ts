import { Queue, type ConnectionOptions } from "bullmq";
import { env } from "../config/env.js";

export const QUEUE_NAME = "incoming-messages";

// Opções de conexão (host/port) em vez de uma instância IORedis, para evitar
// conflito de tipos com a cópia de ioredis que o BullMQ traz aninhada.
const redisUrl = new URL(env.REDIS_URL);
export const connection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  maxRetriesPerRequest: null,
};

export interface IncomingJob {
  tenantId: string;
  conversationId: string;
  waMessageId: string;
}

export const incomingQueue = new Queue<IncomingJob>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});
