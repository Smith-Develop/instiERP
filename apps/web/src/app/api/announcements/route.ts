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

  // Auto-generate notifications for users in the school
  const targetRole = body.target && body.target !== "TODOS" ? body.target : undefined;
  const usersInSchool = await db.user_schools.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null, is_active: true, ...(targetRole ? { role: targetRole } : {}) },
  });

  if (usersInSchool.length > 0) {
    await db.notifications.createMany({
      data: usersInSchool.map((us) => ({
        user_id: us.user_id,
        title: `Nuevo anuncio: ${announcement.title}`,
        content: announcement.content.slice(0, 200),
        type: "ANNOUNCEMENT",
        link: "/dashboard/communication",
      })),
    });
  }

  return NextResponse.json({ success: true, data: announcement }, { status: 201 });
}
