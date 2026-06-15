import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { FastifyInstance } from "fastify";

// Evita que o import da fila conecte no Redis ao montar a app.
vi.mock("../queue/queue.js", () => ({
  incomingQueue: { add: vi.fn() },
  QUEUE_NAME: "incoming-messages",
  connection: {},
}));
vi.mock("../tenants/repo.js", () => ({
  getTenantByApiKey: vi.fn(),
  getTenantByPhoneNumberId: vi.fn(),
}));
vi.mock("../conversations/repo.js", () => ({
  listConversations: vi.fn(),
  getConversationForTenant: vi.fn(),
  listMessages: vi.fn(),
}));

import { buildApp } from "./app.js";
import { getTenantByApiKey } from "../tenants/repo.js";
import {
  getConversationForTenant,
  listConversations,
  listMessages,
} from "../conversations/repo.js";

const byApiKey = getTenantByApiKey as Mock;
const listConvs = listConversations as Mock;
const getConv = getConversationForTenant as Mock;
const listMsgs = listMessages as Mock;

const TENANT = { id: "tenant-1", name: "NeoFibra", apiKey: "dev-key", phoneNumberId: "p1" };

describe("REST /conversations (auth por tenant)", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    byApiKey.mockResolvedValue(TENANT);
    app = buildApp();
  });

  it("401 sem API key", async () => {
    const res = await app.inject({ method: "GET", url: "/conversations" });
    expect(res.statusCode).toBe(401);
    expect(listConvs).not.toHaveBeenCalled();
  });

  it("401 com API key inválida", async () => {
    byApiKey.mockResolvedValue(null);
    const res = await app.inject({
      method: "GET",
      url: "/conversations",
      headers: { authorization: "Bearer chave-errada" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("200 lista conversas do tenant autenticado", async () => {
    listConvs.mockResolvedValue([{ id: "c1", contactName: "Ana" }]);
    const res = await app.inject({
      method: "GET",
      url: "/conversations",
      headers: { authorization: "Bearer dev-key" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([{ id: "c1", contactName: "Ana" }]);
    expect(listConvs).toHaveBeenCalledWith("tenant-1");
  });

  it("404 ao acessar conversa que não é do tenant", async () => {
    getConv.mockResolvedValue(null);
    const res = await app.inject({
      method: "GET",
      url: "/conversations/c-de-outro/messages",
      headers: { authorization: "Bearer dev-key" },
    });
    expect(res.statusCode).toBe(404);
    expect(listMsgs).not.toHaveBeenCalled();
  });

  it("200 retorna mensagens de uma conversa do tenant", async () => {
    getConv.mockResolvedValue({ id: "c1" });
    listMsgs.mockResolvedValue([{ id: "m1", direction: "in", body: "oi" }]);
    const res = await app.inject({
      method: "GET",
      url: "/conversations/c1/messages",
      headers: { "x-api-key": "dev-key" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
    expect(listMsgs).toHaveBeenCalledWith("tenant-1", "c1");
  });
});
