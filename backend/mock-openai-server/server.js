import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

/**
 * Mock de uma API compatível com a OpenAI (Chat Completions), para rodar o
 * caminho do OpenAiProvider OFFLINE, sem chave/custo.
 *
 * Implementa POST /v1/chat/completions devolvendo no formato da OpenAI. A
 * resposta é determinística e claramente identificada como simulada — o objetivo
 * é exercitar a SDK e o parsing da resposta, não substituir a IA real.
 *
 * Use apontando o backend para cá:
 *   OPENAI_BASE_URL=http://localhost:8002/v1
 *   OPENAI_API_KEY=fake-key            (qualquer valor não-vazio)
 */

const PORT = Number(process.env.PORT ?? 8002);

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
  });
}

function lastUserMessage(messages) {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return String(messages[i]?.content ?? "");
  }
  return "";
}

const server = createServer(async (req, res) => {
  const { method, url } = req;

  if (method === "GET" && (url === "/health" || url === "/v1/health")) {
    return json(res, 200, { ok: true, service: "mock-openai" });
  }

  if (method === "POST" && /^\/v1\/chat\/completions\/?$/.test(url ?? "")) {
    const raw = await readBody(req);
    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return json(res, 400, { error: { message: "JSON inválido" } });
    }

    const userMsg = lastUserMessage(body.messages).slice(0, 280);
    const content =
      `[mock-openai] Resposta simulada para: "${userMsg}". ` +
      `Defina OPENAI_API_KEY/base reais para usar a IA de verdade.`;

    console.log(`[chat] completions → "${userMsg.slice(0, 60)}"`);

    return json(res, 200, {
      id: `chatcmpl-mock-${randomUUID()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model ?? "mock-openai",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }

  json(res, 404, { error: { message: "rota não encontrada", method, url } });
});

server.listen(PORT, () => {
  console.log(`mock-openai ouvindo na porta ${PORT} (POST /v1/chat/completions)`);
});
