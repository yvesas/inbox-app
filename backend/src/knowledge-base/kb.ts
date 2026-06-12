import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Carregamento da base de conhecimento (knowledge-base/*.md).
 *
 * A base é pequena (~3,5 KB no total), então optamos por **contexto direto**:
 * concatenamos todos os arquivos e os injetamos no prompt. É mais simples e
 * confiável que um RAG vetorial para este volume — e evita o risco de o
 * retrieval esconder a informação certa do modelo (anti-alucinação).
 *
 * O conteúdo é lido uma vez e mantido em cache no processo.
 */

// .../backend/src/knowledge-base/kb.ts → .../backend/knowledge-base
const KB_DIR = path.resolve(fileURLToPath(import.meta.url), "../../../knowledge-base");

let cache: string | null = null;

export async function loadKnowledgeBase(): Promise<string> {
  if (cache !== null) return cache;

  const files = (await readdir(KB_DIR)).filter((f) => f.endsWith(".md")).sort();
  const parts = await Promise.all(
    files.map(async (file) => {
      const content = await readFile(path.join(KB_DIR, file), "utf8");
      return `### Fonte: ${file}\n\n${content.trim()}`;
    }),
  );

  cache = parts.join("\n\n---\n\n");
  return cache;
}

/** Apenas para testes: descarta o cache para forçar releitura. */
export function resetKnowledgeBaseCache(): void {
  cache = null;
}
