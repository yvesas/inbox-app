import Fastify, { type FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { registerWebhookRoutes } from "./webhook-routes.js";
import { registerConversationRoutes } from "./conversation-routes.js";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

/**
 * Constrói a aplicação Fastify.
 * Exposta separadamente do boot para facilitar os testes (inject).
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "production"
          ? undefined
          : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
    },
  });

  // Preserva o corpo cru (necessário para validar a assinatura HMAC do webhook)
  // e ainda entrega o JSON parseado em req.body.
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (req, body, done) => {
    const buffer = body as Buffer;
    req.rawBody = buffer;
    if (buffer.length === 0) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(buffer.toString("utf8")));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  app.get("/health", async () => ({ ok: true }));

  void registerWebhookRoutes(app);
  void registerConversationRoutes(app);

  return app;
}
