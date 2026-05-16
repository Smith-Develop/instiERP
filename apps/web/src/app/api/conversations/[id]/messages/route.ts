import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.COMMUNICATION_WRITE);
    const { id } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    // Verify user is participant
    const participant = await db.conversation_participants.findUnique({
      where: { conversation_id_user_id: { conversation_id: id, user_id: ctx.userId } },
    });
    if (!participant) {
      return NextResponse.json({ error: "No eres participante" }, { status: 403 });
    }

    const message = await db.messages.create({
      data: { conversation_id: id, sender_id: ctx.userId, content: content.trim() },
    });

    // Update conversation timestamp
    await db.conversations.update({ where: { id }, data: { updated_at: new Date() } });

    return NextResponse.json({ success: true, data: { id: message.id, content: message.content, senderId: message.sender_id, createdAt: message.created_at } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
