import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { notFound } from "next/navigation";
import { ChatView } from "@/modules/messages/chat-view";

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { conversationId } = await params;
  const ctx = await getSessionContext();

  const conversation = await db.conversations.findFirst({
    where: {
      id: conversationId,
      school_id: ctx.schoolId,
      deleted_at: null,
      participants: { some: { user_id: ctx.userId } },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: {
        orderBy: { created_at: "asc" },
        take: 100,
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!conversation) notFound();

  // Mark messages as read
  const unreadIds = conversation.messages
    .filter((m) => !m.is_read && m.sender_id !== ctx.userId)
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await db.messages.updateMany({
      where: { id: { in: unreadIds } },
      data: { is_read: true, read_at: new Date() },
    });
  }

  const title = conversation.title ?? conversation.participants.map((p) => p.user.name).join(", ");

  return (
    <ChatView
      conversationId={conversationId}
      title={title}
      currentUserId={ctx.userId}
      initialMessages={conversation.messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.sender_id,
        senderName: m.sender.name,
        senderRole: m.sender.role,
        createdAt: m.created_at.toISOString(),
        isRead: m.is_read,
      }))}
    />
  );
}
