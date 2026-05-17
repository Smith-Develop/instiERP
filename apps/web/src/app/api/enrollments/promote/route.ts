import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.ENROLLMENTS_WRITE);
    const body = await request.json();
    const { student_ids, target_academic_year_id, target_grade_id, target_section_id } = body;

    if (!student_ids?.length || !target_academic_year_id || !target_grade_id || !target_section_id) {
      return NextResponse.json({ success: false, error: "Datos incompletos" }, { status: 400 });
    }

    const promoted: string[] = [];
    const errors: { student_id: string; error: string }[] = [];

    for (const studentId of student_ids) {
      // Check existing enrollment in target year
      const existing = await db.enrollments.findUnique({
        where: { student_id_academic_year_id: { student_id: studentId, academic_year_id: target_academic_year_id } },
      });

      if (existing && !existing.deleted_at) {
        errors.push({ student_id: studentId, error: "Ya está matriculado en el año destino" });
        continue;
      }

      if (existing) {
        // Reactivate soft-deleted enrollment
        await db.enrollments.update({
          where: { id: existing.id },
          data: { grade_id: target_grade_id, section_id: target_section_id, is_active: true, deleted_at: null },
        });
      } else {
        await db.enrollments.create({
          data: {
            student_id: studentId, grade_id: target_grade_id, section_id: target_section_id,
            academic_year_id: target_academic_year_id, school_id: ctx.schoolId,
          },
        });
      }
      promoted.push(studentId);
    }

    return NextResponse.json({ success: true, data: { promoted, errors } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al promover";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
