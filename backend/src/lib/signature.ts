import crypto from "node:crypto";

/**
 * Valida a assinatura HMAC-SHA256 enviada pela Meta no header X-Hub-Signature-256.
 * O HMAC é calculado sobre o CORPO CRU (raw body) com o META_APP_SECRET.
 * Comparação em tempo constante para evitar timing attacks.
 */
export function verifyMetaSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader) return false;

  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const received = Buffer.from(signatureHeader);
  const computed = Buffer.from(expected);
  if (received.length !== computed.length) return false;

  return crypto.timingSafeEqual(received, computed);
}
