import axios from "axios";

/**
 * Cliente da API já configurado. Aponta para NEXT_PUBLIC_API_URL (veja .env.example).
 * O backend é fornecido e está hospedado — você NÃO precisa implementá-lo.
 *
 * Rotas disponíveis:
 *   GET  /me
 *   GET  /conversations
 *   GET  /conversations/:id/messages
 *   POST /conversations/:id/messages   { text }
 *   POST /ai/suggest                   { conversationId }
 */

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  timeout: 20_000,
});

// ─── Tipos ────────────────────────────────────────────────
export interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  avatarColor: string;
  unread: number;
  lastMessage: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  direction: "in" | "out";
  body: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
}

export interface AiSuggestion {
  suggestion: string;
  source: "openai" | "mock" | "mock-fallback";
}

// ─── Funções ──────────────────────────────────────────────
export async function getMe(): Promise<Agent> {
  const { data } = await api.get<Agent>("/me");
  return data;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>("/conversations");
  return data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
  return data;
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  const { data } = await api.post<Message>(`/conversations/${conversationId}/messages`, { text });
  return data;
}

export async function suggestReply(conversationId: string): Promise<AiSuggestion> {
  const { data } = await api.post<AiSuggestion>("/ai/suggest", { conversationId });
  return data;
}
