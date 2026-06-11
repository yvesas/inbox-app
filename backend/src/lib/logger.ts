import { pino } from "pino";
import { env } from "../config/env.js";

/**
 * Logger estruturado (Pino). Em dev usa pino-pretty para leitura humana.
 * Use `logger.child({ conversationId, waMessageId })` para rastrear uma conversa.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
});
