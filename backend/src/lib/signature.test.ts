import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "./signature.js";

const SECRET = "super-secret-app-secret-trocar";

function sign(body: string, secret = SECRET): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyMetaSignature", () => {
  const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

  it("aceita assinatura válida sobre o raw body", () => {
    expect(verifyMetaSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejeita assinatura calculada com outro segredo", () => {
    expect(verifyMetaSignature(body, sign(body, "outro-segredo"), SECRET)).toBe(false);
  });

  it("rejeita quando o corpo foi adulterado após assinar", () => {
    const signature = sign(body);
    const tampered = body.replace("entry", "ent_ry");
    expect(verifyMetaSignature(tampered, signature, SECRET)).toBe(false);
  });

  it("rejeita header ausente", () => {
    expect(verifyMetaSignature(body, undefined, SECRET)).toBe(false);
  });

  it("rejeita header malformado sem estourar (comparação de tamanho)", () => {
    expect(verifyMetaSignature(body, "sha256=abc", SECRET)).toBe(false);
    expect(verifyMetaSignature(body, "lixo", SECRET)).toBe(false);
  });
});
