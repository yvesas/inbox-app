import { defineConfig } from "vitest/config";

// Silencia o logger e desliga o transport pino-pretty durante os testes,
// mantendo a saída limpa. env.ts lê essas variáveis no import.
export default defineConfig({
  test: {
    env: {
      LOG_LEVEL: "silent",
      NODE_ENV: "production",
    },
  },
});
