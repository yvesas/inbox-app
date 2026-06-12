import "dotenv/config";
import { z } from "zod";

/**
 * Validação centralizada das variáveis de ambiente.
 * Falha cedo (no boot) se algo essencial estiver faltando.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  LOG_LEVEL: z.string().default("info"),
  NODE_ENV: z.string().default("development"),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  OPENAI_API_KEY: z.string().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  // Base URL da API compatível com OpenAI. Vazio = api.openai.com (padrão da SDK).
  // Aponte para o mock-openai para rodar o caminho da IA offline.
  OPENAI_BASE_URL: z.string().default(""),

  META_VERIFY_TOKEN: z.string(),
  META_APP_SECRET: z.string(),
  META_TOKEN: z.string().default("mock-token"),
  META_API_BASE_URL: z.string().default("http://localhost:8001"),
  META_PHONE_NUMBER_ID: z.string(),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
