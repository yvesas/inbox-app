import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

// Conexão única (postgres-js) reutilizada pelo processo.
const queryClient = postgres(env.DATABASE_URL);

export const db = drizzle(queryClient, { schema });
export { schema, queryClient };
