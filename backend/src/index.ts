import "dotenv/config";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { buildApp } from "./http/app.js";

async function main() {
  const app = buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  logger.info(`servidor HTTP ouvindo na porta ${env.PORT}`);
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
