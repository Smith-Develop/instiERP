import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getApiContext();
  const { id } = await params;

  const conversation = await db.conversations.findFirst({
    where: {
      id,
      school_id: ctx.schoolId,
      deleted_at: null,
      participants: { some: { user_id: ctx.userId } },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: { orderBy: { created_at: "asc" }, take: 100, select: { id: true, content: true, sender_id: true, created_at: true, is_read: true } },
    },
  });

  if (!conversation) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  // Mark messages as read
  const unreadIds = conversation.messages.filter((m) => !m.is_read && m.sender_id !== ctx.userId).map((m) => m.id);
  if (unreadIds.length > 0) {
    await db.messages.updateMany({ where: { id: { in: unreadIds } }, data: { is_read: true, read_at: new Date() } });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: conversation.id,
      title: conversation.title ?? conversation.participants.map((p) => p.user.name).join(", "),
      participants: conversation.participants.map((p) => ({ id: p.user.id, name: p.user.name, role: p.user.role })),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.sender_id,
        createdAt: m.created_at,
        isRead: m.is_read,
      })),
    },
  });
}
