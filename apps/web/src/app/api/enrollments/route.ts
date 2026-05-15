import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    const body = await request.json();
    const { student_id, grade_id, section_id, academic_year_id } = body;

    if (!student_id || !grade_id || !section_id || !academic_year_id) {
      return NextResponse.json({ success: false, error: "Datos incompletos" }, { status: 400 });
    }

    // Check if already enrolled this year
    const existing = await db.enrollments.findUnique({
      where: { student_id_academic_year_id: { student_id, academic_year_id } },
    });

    if (existing && !existing.deleted_at) {
      return NextResponse.json({ success: false, error: "Ya está matriculado este año" }, { status: 409 });
    }

    const enrollment = existing
      ? await db.enrollments.update({ where: { id: existing.id }, data: { grade_id, section_id, is_active: true, deleted_at: null } })
      : await db.enrollments.create({ data: { student_id, grade_id, section_id, academic_year_id, school_id: ctx.schoolId } });

    return NextResponse.json({ success: true, data: enrollment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
