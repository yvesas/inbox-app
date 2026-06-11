import type { FastifyReply, FastifyRequest } from "fastify";
import { getTenantByApiKey } from "../tenants/repo.js";
import type { Tenant } from "../db/schema.js";

declare module "fastify" {
  interface FastifyRequest {
    tenant?: Tenant;
  }
}

/**
 * preHandler para as rotas REST: autentica o tenant via API key.
 * Aceita `Authorization: Bearer <key>` ou header `x-api-key`.
 */
export async function authenticateTenant(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers["authorization"];
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const headerKey = req.headers["x-api-key"];
  const apiKey = bearer ?? (typeof headerKey === "string" ? headerKey : undefined);

  if (!apiKey) {
    return reply.code(401).send({ error: "missing_api_key" });
  }

  const tenant = await getTenantByApiKey(apiKey);
  if (!tenant) {
    return reply.code(401).send({ error: "invalid_api_key" });
  }

  req.tenant = tenant;
}
