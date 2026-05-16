import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.COMMUNICATION_READ);
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");

  const where: Record<string, unknown> = { school_id: ctx.schoolId, deleted_at: null };
  if (sectionId) where.section_id = sectionId;

  const posts = await db.class_posts.findMany({
    where: where as never,
    include: { comments: { orderBy: { created_at: "asc" }, take: 5 } },
    orderBy: { created_at: "desc" },
    take: 30,
  });

  return NextResponse.json({ success: true, data: { items: posts } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.COMMUNICATION_WRITE);
    const { sectionId, content, type } = await request.json();
    if (!sectionId || !content) return NextResponse.json({ error: "sectionId y content requeridos" }, { status: 400 });

    const post = await db.class_posts.create({
      data: { school_id: ctx.schoolId, section_id: sectionId, author_id: ctx.userId, content, type: type ?? "POST" },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
