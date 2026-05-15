import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function GET() {
  const ctx = await getApiContext();
  const conversations = await db.conversations.findMany({
    where: {
      school_id: ctx.schoolId,
      deleted_at: null,
      participants: { some: { user_id: ctx.userId } },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: { orderBy: { created_at: "desc" }, take: 1, select: { content: true, created_at: true, is_read: true, sender_id: true } },
    },
    orderBy: { updated_at: "desc" },
  });

  const items = conversations.map((c) => ({
    id: c.id,
    title: c.title ?? c.participants.map((p) => p.user.name).join(", "),
    participants: c.participants.map((p) => ({ id: p.user.id, name: p.user.name, role: p.user.role })),
    lastMessage: c.messages[0] ?? null,
    updatedAt: c.updated_at,
  }));

  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    const { participantIds, title, initialMessage } = await request.json();

    if (!participantIds?.length) {
      return NextResponse.json({ error: "Se requiere al menos un participante" }, { status: 400 });
    }

    // Evitar spam: padres no pueden iniciar chat con profesores
    if (ctx.role === "PADRE") {
      const targetUsers = await db.user.findMany({
        where: { id: { in: participantIds }, deleted_at: null },
      });
      const hasProfesor = targetUsers.some((u) => u.role === "PROFESOR" || u.role === "DIRECTOR");
      if (hasProfesor) {
        return NextResponse.json({ error: "Los padres no pueden iniciar chat con profesores. Solicita al profesor que te contacte." }, { status: 403 });
      }
    }

    const allIds = [...new Set([ctx.userId, ...participantIds])];

    const conversation = await db.conversations.create({
      data: {
        school_id: ctx.schoolId,
        title: title ?? null,
        is_group: allIds.length > 2,
        participants: {
          create: allIds.map((uid) => ({ user_id: uid })),
        },
      },
    });

    if (initialMessage) {
      await db.messages.create({
        data: {
          conversation_id: conversation.id,
          sender_id: ctx.userId,
          content: initialMessage,
        },
      });
    }

    return NextResponse.json({ success: true, data: { id: conversation.id } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
