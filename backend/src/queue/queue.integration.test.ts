import net from "node:net";
import { afterAll, describe, expect, it } from "vitest";
import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { env } from "../config/env.js";

/**
 * Integração real do par produtor↔consumidor contra um Redis de verdade (via
 * BullMQ). Diferente dos testes que mockam a fila, aqui um job é enfileirado e
 * consumido de fato, validando dois contratos centrais da resiliência:
 *  - o worker recebe o payload exato que foi enfileirado;
 *  - o retry/backoff do BullMQ reprocessa um job que falha (config em queue.ts).
 *
 * Usa uma fila dedicada (sufixo -itest) para não tocar a fila de produção, e é
 * pulado automaticamente quando não há Redis acessível — `npm test` segue verde
 * sem docker (sobe com `docker compose up -d redis`).
 */
// Conexão montada a partir do env (sem importar queue.ts, que instanciaria a
// fila de produção e tentaria conectar no boot do módulo).
const redisUrl = new URL(env.REDIS_URL);
const host = redisUrl.hostname;
const port = Number(redisUrl.port || 6379);
const connection: ConnectionOptions = { host, port, maxRetriesPerRequest: null };
const TEST_QUEUE = "incoming-messages-itest";

function redisReachable(): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ host, port });
    const settle = (ok: boolean): void => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(1500);
    sock.once("connect", () => settle(true));
    sock.once("error", () => settle(false));
    sock.once("timeout", () => settle(false));
  });
}

const available = await redisReachable();

interface TestJob {
  tenantId: string;
  value: number;
}

// Aguarda um evento (ou um deadline) sem deixar timer pendurado no processo.
function waitFor<T>(register: (resolve: (v: T) => void) => void, ms = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout aguardando o worker")), ms);
    register((v) => {
      clearTimeout(timer);
      resolve(v);
    });
  });
}

describe.skipIf(!available)("fila incoming (integração — BullMQ + Redis real)", () => {
  const workers: Worker[] = [];
  const queues: Queue[] = [];

  afterAll(async () => {
    await Promise.all(workers.map((w) => w.close()));
    // obliterate limpa a fila de teste do Redis para não vazar entre execuções.
    await Promise.all(queues.map((q) => q.obliterate({ force: true }).then(() => q.close())));
  });

  it("entrega ao worker o mesmo payload que foi enfileirado", async () => {
    const queue = new Queue<TestJob>(TEST_QUEUE, { connection });
    queues.push(queue);

    const received = waitFor<TestJob>((resolve) => {
      const worker = new Worker<TestJob>(
        TEST_QUEUE,
        (job) => {
          resolve(job.data);
          return Promise.resolve();
        },
        { connection },
      );
      workers.push(worker);
    });

    await queue.add("msg", { tenantId: "t-itest", value: 42 });

    expect(await received).toEqual({ tenantId: "t-itest", value: 42 });
  });

  it("reprocessa via retry/backoff um job que falha na primeira tentativa", async () => {
    const queue = new Queue<TestJob>(`${TEST_QUEUE}-retry`, { connection });
    queues.push(queue);

    let attempts = 0;
    const succeeded = waitFor<number>((resolve) => {
      const worker = new Worker<TestJob>(
        `${TEST_QUEUE}-retry`,
        (job) => {
          attempts = job.attemptsMade + 1;
          if (attempts < 2) throw new Error("falha proposital na 1ª tentativa");
          resolve(attempts);
          return Promise.resolve();
        },
        { connection },
      );
      workers.push(worker);
    });

    await queue.add(
      "msg",
      { tenantId: "t-retry", value: 1 },
      { attempts: 3, backoff: { type: "fixed", delay: 50 } },
    );

    // Só conclui após reprocessar: confirma que o retry do BullMQ atuou.
    expect(await succeeded).toBe(2);
    expect(attempts).toBe(2);
  });
});
