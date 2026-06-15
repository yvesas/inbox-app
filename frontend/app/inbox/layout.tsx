import { ConversationList } from "@/components/conversation-list/conversation-list";
import { InboxShell } from "@/components/inbox-shell";

/**
 * Layout do inbox (Server Component): apenas compõe a casca. A lista e o chat são
 * Client Components (estado, polling, interações); a intenção é manter o shell no
 * servidor e isolar a interatividade nas folhas.
 */
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <InboxShell list={<ConversationList />}>{children}</InboxShell>;
}
