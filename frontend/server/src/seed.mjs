// Dados semeados do inbox de atendimento WhatsApp (empresa fictícia "NeoFibra").
// Usados tanto pelo store em memória (local) quanto para popular o DynamoDB (hospedado).

export const TENANT = "default";

export const conversations = [
  {
    id: "c-1001",
    contactName: "Mariana Lopes",
    contactPhone: "5511988887766",
    avatarColor: "#25D366",
    unread: 2,
    lastMessage: "Minha internet caiu de novo agora de manhã 😡",
    lastMessageAt: "2026-06-11T11:42:00.000Z",
  },
  {
    id: "c-1002",
    contactName: "Rafael Augusto",
    contactPhone: "5511977776655",
    avatarColor: "#34B7F1",
    unread: 0,
    lastMessage: "Perfeito, obrigado pela ajuda!",
    lastMessageAt: "2026-06-11T10:15:00.000Z",
  },
  {
    id: "c-1003",
    contactName: "Juliana Prado",
    contactPhone: "5511966665544",
    avatarColor: "#9C27B0",
    unread: 1,
    lastMessage: "Queria fazer upgrade pro plano de 1 Gbps, como funciona?",
    lastMessageAt: "2026-06-11T09:50:00.000Z",
  },
  {
    id: "c-1004",
    contactName: "Pedro Henrique",
    contactPhone: "5511955554433",
    avatarColor: "#FF9800",
    unread: 0,
    lastMessage: "Vou verificar e te aviso. Valeu!",
    lastMessageAt: "2026-06-10T18:30:00.000Z",
  },
  {
    id: "c-1005",
    contactName: "Camila Nogueira",
    contactPhone: "5511944443322",
    avatarColor: "#E91E63",
    unread: 3,
    lastMessage: "O técnico não apareceu no horário marcado",
    lastMessageAt: "2026-06-10T16:05:00.000Z",
  },
];

export const messages = {
  "c-1001": [
    { id: "m-1", direction: "in", body: "Bom dia", status: "read", createdAt: "2026-06-11T11:40:00.000Z" },
    { id: "m-2", direction: "in", body: "Minha internet caiu de novo agora de manhã 😡", status: "read", createdAt: "2026-06-11T11:42:00.000Z" },
  ],
  "c-1002": [
    { id: "m-1", direction: "in", body: "Oi, a segunda via do boleto não chegou", status: "read", createdAt: "2026-06-11T10:05:00.000Z" },
    { id: "m-2", direction: "out", body: "Olá, Rafael! Já reenviei para o seu e-mail e WhatsApp. Pode conferir?", status: "read", createdAt: "2026-06-11T10:12:00.000Z" },
    { id: "m-3", direction: "in", body: "Perfeito, obrigado pela ajuda!", status: "read", createdAt: "2026-06-11T10:15:00.000Z" },
  ],
  "c-1003": [
    { id: "m-1", direction: "in", body: "Queria fazer upgrade pro plano de 1 Gbps, como funciona?", status: "read", createdAt: "2026-06-11T09:50:00.000Z" },
  ],
  "c-1004": [
    { id: "m-1", direction: "in", body: "O ponto mesh extra cobre o segundo andar?", status: "read", createdAt: "2026-06-10T18:20:00.000Z" },
    { id: "m-2", direction: "out", body: "Na maioria dos sobrados sim. Posso agendar uma avaliação técnica gratuita.", status: "read", createdAt: "2026-06-10T18:25:00.000Z" },
    { id: "m-3", direction: "in", body: "Vou verificar e te aviso. Valeu!", status: "read", createdAt: "2026-06-10T18:30:00.000Z" },
  ],
  "c-1005": [
    { id: "m-1", direction: "in", body: "Marquei visita técnica pra hoje de manhã", status: "read", createdAt: "2026-06-10T16:00:00.000Z" },
    { id: "m-2", direction: "in", body: "O técnico não apareceu no horário marcado", status: "read", createdAt: "2026-06-10T16:05:00.000Z" },
  ],
};

export const agent = {
  id: "agent-1",
  name: "Atendente Myde",
  role: "Suporte NeoFibra",
};
