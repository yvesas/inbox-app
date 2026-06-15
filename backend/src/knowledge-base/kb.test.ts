import { afterEach, describe, expect, it } from "vitest";
import { loadKnowledgeBase, resetKnowledgeBaseCache } from "./kb.js";

describe("loadKnowledgeBase", () => {
  afterEach(() => resetKnowledgeBaseCache());

  it("concatena as fontes da base de conhecimento", async () => {
    const kb = await loadKnowledgeBase();
    // 3 arquivos .md (faq, planos, suporte) viram 3 blocos "### Fonte:".
    expect((kb.match(/### Fonte:/g) ?? []).length).toBe(3);
    // Conteúdo real presente (sem alteração).
    expect(kb).toContain("Fibra Start");
    expect(kb).toContain("NeoFibra");
  });

  it("mantém o conteúdo em cache (mesma referência na 2ª chamada)", async () => {
    const a = await loadKnowledgeBase();
    const b = await loadKnowledgeBase();
    expect(b).toBe(a);
  });
});
