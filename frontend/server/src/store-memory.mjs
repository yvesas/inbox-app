// Armazenamento em memória — usado no desenvolvimento local (sem AWS).
// Os dados reiniciam a cada restart do processo (suficiente para o desafio).

import { conversations as seedConversations, messages as seedMessages } from "./seed.mjs";

export function createMemoryStore() {
  const conversations = structuredClone(seedConversations);
  const messages = structuredClone(seedMessages);

  return {
    async listConversations() {
      return structuredClone(conversations);
    },
    async getConversation(id) {
      return conversations.find((c) => c.id === id) ?? null;
    },
    async listMessages(convId) {
      return structuredClone(messages[convId] ?? []);
    },
    async addMessage(convId, message) {
      (messages[convId] ??= []).push(message);
    },
    async updateConversation(convId, patch) {
      const conv = conversations.find((c) => c.id === convId);
      if (conv) Object.assign(conv, patch);
    },
    async seed() {
      return { conversations: conversations.length };
    },
  };
}
