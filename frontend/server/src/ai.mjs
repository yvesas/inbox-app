// Geração de sugestão de resposta para o atendente.
//
// Se OPENAI_API_KEY estiver definido, usa a OpenAI de verdade (proxy server-side — a chave
// NUNCA vai para o browser). Caso contrário, retorna uma sugestão heurística (mock), para que
// o endpoint público continue funcional e sem custo/abuso. Veja o README do servidor.

const SYSTEM_PROMPT = `Você é um atendente da NeoFibra, um provedor de internet fibra óptica.
Escreva uma resposta curta, cordial e objetiva em português do Brasil para a última mensagem
do cliente. Não invente preços ou prazos que você não saiba. Trate o cliente pelo nome quando possível.`;

export async function suggestReply({ contactName, history }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return { suggestion: mockSuggestion(contactName, history), source: "mock" };
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.direction === "in" ? "user" : "assistant",
      content: m.body,
    })),
  ];

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 200, temperature: 0.5 }),
    });
    if (!resp.ok) {
      const detail = await resp.text();
      console.error("[ai] OpenAI respondeu", resp.status, detail);
      return { suggestion: mockSuggestion(contactName, history), source: "mock-fallback" };
    }
    const data = await resp.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim() || mockSuggestion(contactName, history);
    return { suggestion, source: "openai" };
  } catch (err) {
    console.error("[ai] erro ao chamar OpenAI:", err.message);
    return { suggestion: mockSuggestion(contactName, history), source: "mock-fallback" };
  }
}

function mockSuggestion(contactName, history) {
  const last = [...history].reverse().find((m) => m.direction === "in")?.body?.toLowerCase() ?? "";
  const nome = contactName?.split(" ")[0] ?? "";
  const ola = nome ? `Olá, ${nome}! ` : "Olá! ";

  if (last.includes("caiu") || last.includes("sem internet") || last.includes("conexão")) {
    return `${ola}Sinto muito pelo transtorno. Você pode reiniciar o roteador (30s desligado) e me dizer se a luz LOS está vermelha? Se continuar, já abro um chamado técnico dentro do nosso SLA.`;
  }
  if (last.includes("boleto") || last.includes("fatura") || last.includes("pagamento")) {
    return `${ola}Claro! Me confirma seu CPF que eu reenvio a segunda via do boleto agora mesmo por aqui.`;
  }
  if (last.includes("upgrade") || last.includes("plano") || last.includes("gbps") || last.includes("velocidade")) {
    return `${ola}Posso sim te ajudar com o upgrade! O ajuste é imediato e a diferença é cobrada proporcionalmente na fatura. Quer que eu já faça a mudança para o plano de 1 Gbps?`;
  }
  if (last.includes("técnico") || last.includes("visita") || last.includes("agend")) {
    return `${ola}Peço desculpas pelo ocorrido. Vou verificar o agendamento e reagendar com prioridade. Qual o melhor período para você?`;
  }
  return `${ola}Obrigado por entrar em contato com a NeoFibra. Pode me dar mais detalhes para que eu possa te ajudar da melhor forma?`;
}
