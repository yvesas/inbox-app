import { defineConfig, devices } from "@playwright/test";

/**
 * E2E do inbox rodando 100% local e determinístico:
 *  - sobe o backend mock fornecido (`server/local.mjs`, store em memória) na :4000;
 *  - sobe o Next apontado para ele via NEXT_PUBLIC_API_URL (precedência sobre o
 *    `.env.local`, que aponta para a API hospedada).
 *
 * Fora do CI de propósito (pipeline leve) — roda sob demanda com `npm run e2e`.
 */
const APP_URL = "http://localhost:3000";
const MOCK_URL = "http://localhost:4000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: APP_URL,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      command: "node server/local.mjs",
      port: 4000,
      reuseExistingServer: !process.env.CI,
      stdout: "ignore",
    },
    {
      command: "npm run dev",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { NEXT_PUBLIC_API_URL: MOCK_URL },
    },
  ],
});
