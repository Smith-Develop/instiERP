import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.COMMUNICATION_WRITE);
    const { id } = await params;
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: "Content requerido" }, { status: 400 });

    const comment = await db.post_comments.create({
      data: { post_id: id, author_id: ctx.userId, content },
    });

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
