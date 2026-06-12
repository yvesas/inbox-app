import type { LlmProvider, ReplyInput } from "./types.js";

/**
 * Provedor determinístico, SEM custo e SEM chave de API.
 *
 * Faz um retrieval léxico simples sobre a base de conhecimento: quebra a base
 * em blocos (separados por linha em branco), pontua cada bloco pela sobreposição
 * de palavras com a mensagem do cliente e devolve o bloco mais relevante.
 * Quando nada passa do limiar, responde honestamente que não sabe — mantendo a
 * mesma postura anti-alucinação do provedor de IA.
 *
 * Não é tão fluente quanto um LLM, mas torna o fluxo ponta-a-ponta funcional e
 * testável sem depender da OpenAI. O provedor de IA assume automaticamente
 * quando uma OPENAI_API_KEY válida está presente.
 */
export class StubProvider implements LlmProvider {
  readonly name = "stub";

  async generateReply(input: ReplyInput): Promise<string> {
    return generateStubReply(input);
  }
}

const GREETINGS = ["oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "eai", "e ai"];

// Palavras muito comuns que não ajudam a discriminar blocos.
const STOPWORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "e",
  "ou",
  "que",
  "qual",
  "quais",
  "para",
  "por",
  "com",
  "sem",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "me",
  "meu",
  "minha",
  "quanto",
  "quantos",
  "como",
  "onde",
  "quando",
  "tem",
  "ter",
  "voce",
  "vocês",
  "voces",
  "eu",
  "é",
  "sao",
  "são",
  "ao",
  "se",
]);

export function generateStubReply(input: ReplyInput): string {
  const message = input.userMessage.trim();
  const normalized = normalize(message);

  if (isGreeting(normalized)) {
    return "Olá! Sou o assistente virtual da NeoFibra. Posso ajudar com planos, preços, suporte e segunda via de boleto. Como posso ajudar?";
  }

  const tokens = tokenize(normalized).filter((t) => !STOPWORDS.has(t));
  const blocks = splitBlocks(input.knowledgeBase);

  let best: { block: string; score: number } | null = null;
  for (const block of blocks) {
    const score = scoreBlock(block, tokens);
    if (score > 0 && (best === null || score > best.score)) {
      best = { block, score };
    }
  }

  if (best === null || best.score < 2) {
    return "Não tenho essa informação aqui no momento. Posso te encaminhar para um atendente humano, se preferir.";
  }

  return cleanBlock(best.block);
}

function isGreeting(normalized: string): boolean {
  return GREETINGS.some((g) => normalized === g || normalized.startsWith(g + " "));
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); // remove acentos (combining marks)
}

function tokenize(normalized: string): string[] {
  return normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

/**
 * Quebra a base em seções: cada cabeçalho markdown (#..######) inicia uma nova
 * seção que carrega o título + o corpo até o próximo cabeçalho. Manter título e
 * conteúdo juntos melhora a pontuação (as palavras do título também contam).
 */
function splitBlocks(knowledgeBase: string): string[] {
  const sections: string[] = [];
  let current: string[] = [];

  const flush = (): void => {
    if (current.length > 0) {
      sections.push(current.join("\n").trim());
      current = [];
    }
  };

  for (const line of knowledgeBase.split("\n")) {
    const trimmed = line.trim();
    if (/^#{1,6}\s/.test(trimmed)) {
      flush();
      current.push(line);
    } else if (trimmed === "---") {
      flush(); // separador entre fontes
    } else {
      current.push(line);
    }
  }
  flush();

  return sections.filter((s) => s.length > 0 && !/^#{1,6}\s+Fonte:/.test(s));
}

function scoreBlock(block: string, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const blockTokens = new Set(tokenize(normalize(block)));
  let score = 0;
  for (const token of queryTokens) {
    if (blockTokens.has(token)) score += 1;
  }
  return score;
}

/** Remove o título markdown do bloco para uma resposta mais natural no chat. */
function cleanBlock(block: string): string {
  return block
    .split("\n")
    .filter((line) => !/^#{1,6}\s/.test(line.trim()))
    .join("\n")
    .trim();
}
