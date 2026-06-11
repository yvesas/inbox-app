import type { FastifyInstance } from "fastify";
import { authenticateTenant } from "./auth.js";
import {
  getConversationForTenant,
  listConversations,
  listMessages,
} from "../conversations/repo.js";

export async function registerConversationRoutes(app: FastifyInstance) {
  app.get("/conversations", { preHandler: authenticateTenant }, async (req, reply) => {
    const tenant = req.tenant!;
    const data = await listConversations(tenant.id);
    return reply.send(data);
  });

  app.get(
    "/conversations/:id/messages",
    { preHandler: authenticateTenant },
    async (req, reply) => {
      const tenant = req.tenant!;
      const { id } = req.params as { id: string };

      const conversation = await getConversationForTenant(tenant.id, id);
      if (!conversation) {
        return reply.code(404).send({ error: "conversation_not_found" });
      }

      const data = await listMessages(tenant.id, id);
      return reply.send(data);
    },
  );
}
