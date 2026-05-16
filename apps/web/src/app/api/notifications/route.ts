import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.COMMUNICATION_READ);
  const items = await db.notifications.findMany({
    where: { user_id: ctx.userId },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return NextResponse.json({
    success: true,
    data: {
      items: items.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        type: n.type,
        isRead: n.is_read,
        link: n.link,
        createdAt: n.created_at,
      })),
      unreadCount: items.filter((n) => !n.is_read).length,
    },
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.COMMUNICATION_READ);
  const { ids } = await request.json();

  if (ids?.length) {
    await db.notifications.updateMany({
      where: { id: { in: ids }, user_id: ctx.userId },
      data: { is_read: true, read_at: new Date() },
    });
  } else {
    // Mark all as read
    await db.notifications.updateMany({
      where: { user_id: ctx.userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
