import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { tenants } from "../db/schema.js";

export async function getTenantByPhoneNumberId(phoneNumberId: string) {
  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.phoneNumberId, phoneNumberId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getTenantByApiKey(apiKey: string) {
  const rows = await db.select().from(tenants).where(eq(tenants.apiKey, apiKey)).limit(1);
  return rows[0] ?? null;
}
