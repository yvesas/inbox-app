import { defineConfig } from "vitest/config";

// Silencia o logger e desliga o transport pino-pretty durante os testes,
// mantendo a saída limpa. env.ts lê essas variáveis no import.
export default defineConfig({
  test: {
    env: {
      LOG_LEVEL: "silent",
      NODE_ENV: "production",
    },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts", // entrypoint da API
        "src/worker.ts", // entrypoint do worker (consumer BullMQ)
        "src/db/seed.ts", // script de seed (dev)
        "src/db/client.ts", // glue de conexão
        "src/queue/queue.ts", // config da fila (coberta via integração depois)
        "src/llm/types.ts", // apenas tipos
      ],
      // Threshold conservador; sobe aos poucos. No CI a integração roda (DB+Redis),
      // elevando a cobertura real de ingest/context/repos.
      thresholds: {
        lines: 70,
        statements: 70,
        branches: 75,
        functions: 65,
      },
    },
  },
});
