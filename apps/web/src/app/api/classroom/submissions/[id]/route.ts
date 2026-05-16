import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.SUBMISSIONS_WRITE);
    const { id } = await params;
    const { score, feedback, status } = await request.json();

    if (score != null && (Number(score) < 0 || Number(score) > 10)) {
      return NextResponse.json({ error: "Nota debe estar entre 0 y 10" }, { status: 400 });
    }

    const submission = await db.classroom_submissions.update({
      where: { id },
      data: {
        score: score != null ? Number(score) : undefined,
        feedback: feedback ?? undefined,
        status: status ?? "CALIFICADO",
        graded_at: new Date(),
      },
      include: { assignment: { select: { grade_item_id: true } } },
    });

    // Auto-sync with student_grades
    if (submission.assignment.grade_item_id && score != null) {
      await db.student_grades.upsert({
        where: { student_id_grade_item_id: { student_id: submission.student_id, grade_item_id: submission.assignment.grade_item_id } },
        update: { score: Number(score), notes: feedback },
        create: {
          academic_year_id: (await db.classroom_assignments.findUnique({ where: { id: submission.assignment_id } }))?.academic_year_id ?? "",
          student_id: submission.student_id,
          grade_item_id: submission.assignment.grade_item_id,
          score: Number(score),
          notes: feedback,
          graded_by: ctx.userId,
        },
      });
    }

    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
