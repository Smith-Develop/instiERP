import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.SUBMISSIONS_READ);
  const { id } = await params;

  // Get student profile for students
  let studentId: string | undefined;
  if (ctx.role === "ESTUDIANTE") {
    const student = await db.students.findFirst({ where: { user_id: ctx.userId, school_id: ctx.schoolId } });
    studentId = student?.id;
  }

  const submissions = await db.classroom_submissions.findMany({
    where: { assignment_id: id, ...(studentId ? { student_id: studentId } : {}), deleted_at: null },
    include: { student: { select: { first_name: true, last_name: true } } },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ success: true, data: { items: submissions } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SUBMISSIONS_WRITE);
    const { id } = await params;
    const body = await request.json();

    // Get student profile
    const student = await db.students.findFirst({ where: { user_id: ctx.userId, school_id: ctx.schoolId } });
    if (!student) return NextResponse.json({ error: "Perfil de estudiante no encontrado" }, { status: 403 });

    // Check assignment exists and is published
    const assignment = await db.classroom_assignments.findUnique({ where: { id, deleted_at: null } });
    if (!assignment || assignment.status !== "PUBLISHED") return NextResponse.json({ error: "Tarea no disponible" }, { status: 404 });

    const submission = await db.classroom_submissions.upsert({
      where: { assignment_id_student_id: { assignment_id: id, student_id: student.id } },
      update: { content: body.content, files: body.files, status: "ENTREGADO", submitted_at: new Date() },
      create: { assignment_id: id, student_id: student.id, content: body.content, files: body.files, status: "ENTREGADO", submitted_at: new Date() },
    });

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
