import { Chat } from "@/components/chat/chat";

/**
 * Rota da conversa. Server Component que apenas resolve o param (Promise no Next 15)
 * e delega para o `Chat` (Client), onde vivem as queries e a interação.
 */
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <Chat conversationId={conversationId} />;
}
