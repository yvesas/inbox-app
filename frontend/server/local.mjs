// Servidor HTTP local — usa o store em memória (sem AWS, sem dependências).
// Rode com:  node local.mjs   (ou: docker compose up)
import { createServer } from "node:http";
import { handle } from "./src/router.mjs";
import { createMemoryStore } from "./src/store-memory.mjs";

const PORT = Number(process.env.PORT ?? 4000);
const store = createMemoryStore();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
  }

  const result = await handle(
    {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body,
      headers: req.headers,
    },
    store,
  );

  res.writeHead(result.status, result.headers);
  res.end(typeof result.body === "string" ? result.body : JSON.stringify(result.body));
});

server.listen(PORT, () => {
  console.log(`API local em http://localhost:${PORT}`);
  console.log(`  GET http://localhost:${PORT}/conversations`);
});
