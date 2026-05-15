import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { MessageList } from "@/modules/messages/message-list";

export default async function MessagesPage() {
  const ctx = await getSessionContext();

  const conversations = await db.conversations.findMany({
    where: {
      school_id: ctx.schoolId,
      deleted_at: null,
      participants: { some: { user_id: ctx.userId } },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: { orderBy: { created_at: "desc" }, take: 1 },
    },
    orderBy: { updated_at: "desc" },
  });

  const items = conversations.map((c) => ({
    id: c.id,
    title: c.title ?? c.participants.map((p) => p.user.name).join(", "),
    participants: c.participants.map((p) => p.user.name),
    lastMessage: c.messages[0] ?? null,
    unreadCount: c.messages.filter((m) => !m.is_read && m.sender_id !== ctx.userId).length,
    updatedAt: c.updated_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mensajes</h2>
          <p className="text-sm text-slate-500">{items.length} conversaciones</p>
        </div>
        <a href="/dashboard/messages/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nuevo mensaje</a>
      </div>
      <MessageList conversations={items} currentUserId={ctx.userId} currentUserRole={ctx.role} />
    </div>
  );
}
