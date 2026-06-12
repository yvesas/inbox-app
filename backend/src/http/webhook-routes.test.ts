import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { FastifyInstance } from "fastify";

// Mocka as dependências de I/O do handler para testar só o roteamento/regra.
vi.mock("../tenants/repo.js", () => ({
  getTenantByPhoneNumberId: vi.fn(),
  getTenantByApiKey: vi.fn(),
}));
vi.mock("../messaging/ingest.js", () => ({ ingestInbound: vi.fn() }));
vi.mock("../queue/queue.js", () => ({
  incomingQueue: { add: vi.fn() },
  QUEUE_NAME: "incoming-messages",
  connection: {},
}));

import { buildApp } from "./app.js";
import { env } from "../config/env.js";
import { getTenantByPhoneNumberId } from "../tenants/repo.js";
import { ingestInbound } from "../messaging/ingest.js";
import { incomingQueue } from "../queue/queue.js";

const getTenant = getTenantByPhoneNumberId as Mock;
const ingest = ingestInbound as Mock;
const queueAdd = incomingQueue.add as Mock;

const PHONE_ID = "123456789012345";
const TENANT = { id: "tenant-1", name: "NeoFibra", apiKey: "k", phoneNumberId: PHONE_ID };

function sign(body: string): string {
  return "sha256=" + crypto.createHmac("sha256", env.META_APP_SECRET).update(body).digest("hex");
}

function payload(waMessageId = "wamid.ABC") {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA",
        changes: [
          {
            field: "messages",
            value: {
              metadata: { phone_number_id: PHONE_ID },
              contacts: [{ profile: { name: "Ana" }, wa_id: "5511999990000" }],
              messages: [
                { from: "5511999990000", id: waMessageId, type: "text", text: { body: "Olá" } },
              ],
            },
          },
        ],
      },
    ],
  });
}

function post(app: FastifyInstance, body: string, signature = sign(body)) {
  return app.inject({
    method: "POST",
    url: "/webhook",
    headers: { "content-type": "application/json", "x-hub-signature-256": signature },
    payload: body,
  });
}

describe("POST /webhook", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    getTenant.mockResolvedValue(TENANT);
    ingest.mockResolvedValue({ conversationId: "conv-1", isNew: true });
    queueAdd.mockResolvedValue(undefined);
    app = buildApp();
  });

  it("rejeita assinatura inválida com 403 e não persiste", async () => {
    const body = payload();
    const res = await post(app, body, "sha256=invalida");
    expect(res.statusCode).toBe(403);
    expect(ingest).not.toHaveBeenCalled();
    expect(queueAdd).not.toHaveBeenCalled();
  });

  it("persiste e enfileira uma mensagem nova (200)", async () => {
    const res = await post(app, payload());
    expect(res.statusCode).toBe(200);
    expect(ingest).toHaveBeenCalledTimes(1);
    expect(queueAdd).toHaveBeenCalledTimes(1);
    expect(queueAdd.mock.calls[0]?.[1]).toMatchObject({
      tenantId: "tenant-1",
      conversationId: "conv-1",
      waMessageId: "wamid.ABC",
    });
  });

  it("idempotência: reentrega (isNew=false) não re-enfileira", async () => {
    ingest.mockResolvedValue({ conversationId: "conv-1", isNew: false });
    const res = await post(app, payload());
    expect(res.statusCode).toBe(200);
    expect(ingest).toHaveBeenCalledTimes(1);
    expect(queueAdd).not.toHaveBeenCalled();
  });

  it("multi-tenant: phone_number_id desconhecido é ignorado (não persiste)", async () => {
    getTenant.mockResolvedValue(null);
    const res = await post(app, payload());
    expect(res.statusCode).toBe(200);
    expect(ingest).not.toHaveBeenCalled();
    expect(queueAdd).not.toHaveBeenCalled();
  });
});

describe("GET /webhook (handshake)", () => {
  let app: FastifyInstance;
  beforeEach(() => {
    app = buildApp();
  });

  it("devolve o challenge quando o verify_token confere", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/webhook?hub.mode=subscribe&hub.verify_token=${env.META_VERIFY_TOKEN}&hub.challenge=42`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("42");
  });

  it("rejeita verify_token errado com 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/webhook?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=42",
    });
    expect(res.statusCode).toBe(403);
  });
});
