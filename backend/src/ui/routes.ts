import type { FastifyInstance } from "fastify";
import { getConversationForTenant } from "../conversations/repo.js";
import { getLlmProvider } from "../llm/index.js";
import { loadKnowledgeBase } from "../knowledge-base/kb.js";
import { sendWhatsAppText } from "../messaging/delivery.js";
import { logger } from "../lib/logger.js";
import {
  getDemoTenantId,
  insertOutboundMessage,
  listConversationsForUi,
  listMessagesForUi,
  loadSuggestContext,
} from "./repo.js";

/**
 * Rotas /ui — um BFF que adapta o backend ao contrato que o frontend consome
 * (`/me`, `/conversations`, `POST .../messages`, `/ai/suggest`). Servem um único
 * tenant de demonstração e dispensam autenticação, para a app web consumir direto.
 *
 * Mantidas sob o prefixo `/ui` para não colidir com a REST multi-tenant autenticada
 * (`GET /conversations` com Bearer), que continua sendo a entrega oficial do backend.
 */

// Provedor de LLM escolhido uma vez (OpenAI se houver chave; senão, stub ancorado na KB).
const provider = getLlmProvider();

const AGENT = { id: "agent-1", name: "Atendente NeoFibra", role: "Suporte NeoFibra" };

export async function registerUiRoutes(app: FastifyInstance): Promise<void> {
  await app.register(
    async (ui) => {
      // Resolve o tenant de demo; 503 se o seed ainda não rodou.
      ui.addHook("preHandler", async (req, reply) => {
        const tenantId = await getDemoTenantId();
        if (!tenantId) {
          return reply.code(503).send({ error: "demo_tenant_unavailable" });
        }
        req.uiTenantId = tenantId;
      });

      ui.get("/me", async () => AGENT);

      ui.get("/conversations", async (req) => {
        return listConversationsForUi(req.uiTenantId!);
      });

      ui.get("/conversations/:id/messages", async (req, reply) => {
        const { id } = req.params as { id: string };
        const conv = await getConversationForTenant(req.uiTenantId!, id);
        if (!conv) return reply.code(404).send({ error: "conversation_not_found" });
        return listMessagesForUi(req.uiTenantId!, id);
      });

      ui.post("/conversations/:id/messages", async (req, reply) => {
        const { id } = req.params as { id: string };
        const text = (req.body as { text?: unknown })?.text;
        if (typeof text !== "string" || text.trim() === "") {
          return reply.code(400).send({ error: "text_required" });
        }

        const conv = await getConversationForTenant(req.uiTenantId!, id);
        if (!conv) return reply.code(404).send({ error: "conversation_not_found" });

        const message = await insertOutboundMessage(req.uiTenantId!, id, text.trim());

        // Entrega ao cliente via mock da Meta — best-effort (não derruba o envio do atendente).
        const ctx = await loadSuggestContext(req.uiTenantId!, id);
        if (ctx) {
          try {
            await sendWhatsAppText({ to: ctx.contactWaId, body: text.trim() });
          } catch (err) {
            logger.warn({ err: (err as Error).message }, "falha ao entregar mensagem do atendente");
          }
        }

        return reply.code(201).send(message);
      });

      ui.post("/ai/suggest", async (req, reply) => {
        const conversationId = (req.body as { conversationId?: unknown })?.conversationId;
        if (typeof conversationId !== "string") {
          return reply.code(400).send({ error: "conversationId_required" });
        }

        const ctx = await loadSuggestContext(req.uiTenantId!, conversationId);
        if (!ctx) return reply.code(404).send({ error: "conversation_not_found" });

        const knowledgeBase = await loadKnowledgeBase();
        const suggestion = await provider.generateReply({
          userMessage: ctx.userMessage,
          history: ctx.history,
          knowledgeBase,
        });

        return { suggestion, source: provider.name === "openai" ? "openai" : "mock" };
      });
    },
    { prefix: "/ui" },
  );
}

declare module "fastify" {
  interface FastifyRequest {
    uiTenantId?: string;
  }
}
