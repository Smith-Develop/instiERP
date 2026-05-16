import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

async function notifyGrade(studentId: string, score: number | null, gradeItemName: string) {
  const student = await db.students.findUnique({ where: { id: studentId }, select: { first_name: true, user_id: true } });
  if (!student?.user_id) return;
  await db.notifications.create({
    data: {
      user_id: student.user_id,
      title: `Nueva calificación: ${gradeItemName}`,
      content: `${student.first_name} recibió ${score != null ? score.toFixed(1) : "—"} en ${gradeItemName}.`,
      type: "INFO",
      link: "/dashboard/grades",
    },
  }).catch(() => {});
}

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

    // Check for closed periods — block if any grade_item's period is closed
    const gradeItemIds = grades.map((g) => g.gradeItemId);
    const items = await db.grade_items.findMany({
      where: { id: { in: gradeItemIds }, deleted_at: null },
    });

    if (items.length > 0) {
      const periodsToCheck = [...new Set(items.map((i) => ({ grade_id: i.grade_id, period: i.period })))];
      const closedPeriods = await db.closed_periods.findMany({
        where: {
          OR: periodsToCheck.map((p) => ({
            grade_id: p.grade_id,
            period: p.period,
            is_closed: true,
          })),
        },
      });

      if (closedPeriods.length > 0) {
        const closedNames = closedPeriods.map((c) => c.period.replace("_", " ")).join(", ");
        return NextResponse.json({ error: `Periodo cerrado: ${closedNames}. No se pueden modificar las notas.` }, { status: 403 });
      }
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

    // Notify students of new grades
    const itemMap = new Map(items.map(i => [i.id, i]));
    for (const g of grades) {
      if (g.score !== null) {
        const gi = itemMap.get(g.gradeItemId);
        notifyGrade(g.studentId, g.score, gi?.name ?? "Criterio").catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      count: results.filter(Boolean).length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
