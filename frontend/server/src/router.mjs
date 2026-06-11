// Núcleo de roteamento, independente de transporte (HTTP local ou API Gateway/Lambda) e de
// armazenamento (memória ou DynamoDB). Recebe uma requisição normalizada + um "store".

import { randomUUID } from "node:crypto";
import { suggestReply } from "./ai.mjs";
import { agent } from "./seed.mjs";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,x-seed-token",
};

function ok(body, status = 200) {
  return { status, headers: { "content-type": "application/json", ...CORS }, body };
}
function err(status, message) {
  return ok({ error: message }, status);
}

/**
 * @param {{method:string, path:string, query:object, body:any, headers:object}} req
 * @param {object} store
 */
export async function handle(req, store) {
  const { method, path } = req;

  if (method === "OPTIONS") return { status: 204, headers: CORS, body: "" };
  if (method === "GET" && path === "/health") return ok({ ok: true });
  if (method === "GET" && path === "/me") return ok(agent);

  if (method === "GET" && path === "/conversations") {
    const list = await store.listConversations();
    list.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
    return ok(list);
  }

  // /conversations/:id/messages
  const msgMatch = path.match(/^\/conversations\/([^/]+)\/messages$/);
  if (msgMatch) {
    const convId = msgMatch[1];
    const conv = await store.getConversation(convId);
    if (!conv) return err(404, "conversa não encontrada");

    if (method === "GET") {
      const list = await store.listMessages(convId);
      list.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
      return ok(list);
    }

    if (method === "POST") {
      const text = req.body?.text?.toString().trim();
      if (!text) return err(400, "campo obrigatório: text");
      const now = new Date().toISOString();
      const message = {
        id: `m-${randomUUID().slice(0, 8)}`,
        direction: "out",
        body: text,
        status: "sent",
        createdAt: now,
      };
      await store.addMessage(convId, message);
      await store.updateConversation(convId, { lastMessage: text, lastMessageAt: now, unread: 0 });
      return ok(message, 201);
    }
  }

  if (method === "POST" && path === "/ai/suggest") {
    const convId = req.body?.conversationId;
    if (!convId) return err(400, "campo obrigatório: conversationId");
    const conv = await store.getConversation(convId);
    if (!conv) return err(404, "conversa não encontrada");
    const history = await store.listMessages(convId);
    history.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    const result = await suggestReply({ contactName: conv.contactName, history });
    return ok(result);
  }

  // Rota administrativa para popular o DynamoDB uma única vez após o deploy.
  if (method === "POST" && path === "/admin/seed") {
    const token = req.headers["x-seed-token"];
    if (!token || token !== process.env.SEED_TOKEN) return err(401, "token inválido");
    const count = await store.seed();
    return ok({ seeded: true, ...count });
  }

  return err(404, "rota não encontrada");
}
