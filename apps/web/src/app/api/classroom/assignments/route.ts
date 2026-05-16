import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.ASSIGNMENTS_READ);
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");
  const studentId = searchParams.get("studentId");

  const where: Record<string, unknown> = { school_id: ctx.schoolId, deleted_at: null };
  if (sectionId) where.section_id = sectionId;
  if (ctx.role === "ESTUDIANTE") where.status = "PUBLISHED";

  const items = await db.classroom_assignments.findMany({
    where: where as never,
    include: {
      teacher: { select: { first_name: true, last_name: true } },
      subject: { select: { name: true } },
      submissions: studentId
        ? { where: { student_id: studentId }, take: 1 }
        : { select: { id: true, status: true, student_id: true } },
    },
    orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
  });

  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.ASSIGNMENTS_WRITE);
    const body = await request.json();
    if (!body.title || !body.subject_id || !body.grade_id) {
      return NextResponse.json({ error: "title, subject_id y grade_id requeridos" }, { status: 400 });
    }

    // Find teacher profile
    const teacher = await db.teachers.findFirst({ where: { user_id: ctx.userId, school_id: ctx.schoolId } });
    if (!teacher) return NextResponse.json({ error: "Solo profesores pueden crear tareas" }, { status: 403 });

    const assignment = await db.classroom_assignments.create({
      data: {
        school_id: ctx.schoolId, academic_year_id: ctx.academicYearId,
        teacher_id: teacher.id, subject_id: body.subject_id, grade_id: body.grade_id,
        section_id: body.section_id || null, title: body.title,
        description: body.description || null, type: body.type ?? "TAREA",
        points: body.points ? Number(body.points) : null, due_date: body.due_date ? new Date(body.due_date) : null,
        status: body.status ?? "PUBLISHED", allow_student_posts: body.allow_student_posts ?? false,
      },
    });

    // Auto-create grade_item for sync
    if (body.points) {
      const gradeItem = await db.grade_items.create({
        data: {
          school_id: ctx.schoolId, academic_year_id: ctx.academicYearId,
          subject_id: body.subject_id, grade_id: body.grade_id, section_id: body.section_id || null,
          name: `Tarea: ${body.title}`, weight: Number(body.points),
          period: "TRIMESTRE_1",
        },
      });
      await db.classroom_assignments.update({
        where: { id: assignment.id },
        data: { grade_item_id: gradeItem.id },
      });
    }

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
