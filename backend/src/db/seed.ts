import "dotenv/config";
import { env } from "../config/env.js";
import { db, queryClient } from "./client.js";
import { tenants } from "./schema.js";

/**
 * Cria um tenant de desenvolvimento (NeoFibra) cujo phone_number_id casa com o
 * META_PHONE_NUMBER_ID usado pelo mock-meta. Idempotente.
 */
async function main() {
  await db
    .insert(tenants)
    .values({
      name: "NeoFibra",
      apiKey: "dev-api-key-neofibra",
      phoneNumberId: env.META_PHONE_NUMBER_ID,
    })
    .onConflictDoNothing({ target: tenants.phoneNumberId });

  const all = await db.select().from(tenants);
  console.log("tenants:", all);
  await queryClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
