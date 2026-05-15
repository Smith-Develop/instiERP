import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");
    const gradeItemId = searchParams.get("gradeItemId");

    if (!sectionId || !gradeItemId) {
      return NextResponse.json(
        { error: "sectionId y gradeItemId son requeridos" },
        { status: 400 },
      );
    }

    // Get enrolled students
    const enrollments = await db.enrollments.findMany({
      where: { section_id: sectionId, deleted_at: null, is_active: true },
      include: {
        student: { select: { id: true, first_name: true, last_name: true } },
      },
    });

    // Get existing grades for this grade item
    const existingGrades = await db.student_grades.findMany({
      where: {
        grade_item_id: gradeItemId,
        student_id: { in: enrollments.map((e) => e.student_id) },
        deleted_at: null,
      },
    });

    const gradeMap = new Map(
      existingGrades.map((g) => [g.student_id, g]),
    );

    const grades = enrollments.map((enrollment) => {
      const existing = gradeMap.get(enrollment.student.id);
      return {
        studentId: enrollment.student.id,
        studentName: `${enrollment.student.last_name}, ${enrollment.student.first_name}`,
        gradeItemId,
        score: existing?.score ? String(existing.score) : "",
        gradeId: existing?.id ?? undefined,
      };
    });

    grades.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return NextResponse.json({ grades });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { academicYearId, grades } = body as {
      academicYearId: string;
      grades: {
        studentId: string;
        gradeItemId: string;
        score: number | null;
        gradeId?: string;
      }[];
    };

    if (!grades?.length) {
      return NextResponse.json({ error: "No hay notas para guardar" }, { status: 400 });
    }

    const results = await Promise.all(
      grades.map(async (grade) => {
        if (grade.gradeId) {
          // Update existing
          return db.student_grades.update({
            where: { id: grade.gradeId },
            data: { score: grade.score },
          });
        } else if (grade.score !== null) {
          // Create new
          return db.student_grades.create({
            data: {
              academic_year_id: academicYearId,
              student_id: grade.studentId,
              grade_item_id: grade.gradeItemId,
              score: grade.score,
            },
          });
        }
        return null;
      }),
    );

    return NextResponse.json({
      success: true,
      count: results.filter(Boolean).length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
