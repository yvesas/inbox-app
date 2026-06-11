// Handler do AWS Lambda (API Gateway HTTP API — payload v2).
import { handle } from "./router.mjs";
import { createDynamoStore } from "./store-dynamo.mjs";

const store = createDynamoStore();

export async function handler(event) {
  const method = event.requestContext?.http?.method ?? "GET";
  const path = event.rawPath ?? "/";
  let body = null;
  if (event.body) {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
  }

  const result = await handle(
    { method, path, query: event.queryStringParameters ?? {}, body, headers: event.headers ?? {} },
    store,
  );

  return {
    statusCode: result.status,
    headers: result.headers,
    body: typeof result.body === "string" ? result.body : JSON.stringify(result.body),
  };
}
