import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function GET() {
  const ctx = await getApiContext();
  const items = await db.announcements.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  const ctx = await getApiContext();
  const body = await request.json();
  if (!body.title || !body.content) return NextResponse.json({ success: false, error: "Título y contenido requeridos" }, { status: 400 });
  const announcement = await db.announcements.create({
    data: { title: body.title, content: body.content, target: body.target ?? "TODOS", author_id: ctx.userId, school_id: ctx.schoolId },
  });
  return NextResponse.json({ success: true, data: announcement }, { status: 201 });
}
