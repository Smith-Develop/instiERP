import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.TEACHERS_READ);

  const items = await db.teacher_assignments.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { teacher: { select: { id: true, first_name: true, last_name: true } }, subject: { select: { id: true, name: true } }, grade: { select: { id: true, name: true } }, section: { select: { id: true, name: true } } },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.TEACHERS_WRITE);
    const body = await request.json();

    if (!body.teacher_id || !body.subject_id || !body.grade_id) {
      return NextResponse.json({ error: "teacher_id, subject_id, grade_id requeridos" }, { status: 400 });
    }

    const assignment = await db.teacher_assignments.create({
      data: {
        teacher_id: body.teacher_id, subject_id: body.subject_id, grade_id: body.grade_id,
        section_id: body.section_id || null, school_id: ctx.schoolId, is_primary: body.is_primary ?? false,
      },
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
