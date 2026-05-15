import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const gradeId = searchParams.get("gradeId");
    const sectionId = searchParams.get("sectionId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId requerido" },
        { status: 400 },
      );
    }

    const items = await db.grade_items.findMany({
      where: {
        subject_id: subjectId,
        grade_id: gradeId ?? undefined,
        section_id: sectionId ?? undefined,
        deleted_at: null,
      },
      orderBy: { name: "asc" },
    });

    // If no items exist, create defaults
    if (items.length === 0) {
      const defaults = [
        { name: "Exámenes", weight: 0.6, period: "TRIMESTRE_1" },
        { name: "Tareas", weight: 0.3, period: "TRIMESTRE_1" },
        { name: "Actitud", weight: 0.1, period: "TRIMESTRE_1" },
      ];

      // Need school_id and academic_year_id from params
      const schoolId = searchParams.get("schoolId");
      const academicYearId = searchParams.get("academicYearId");

      if (schoolId && academicYearId && gradeId) {
        const created = await Promise.all(
          defaults.map((d) =>
            db.grade_items.create({
              data: {
                ...d,
                subject_id: subjectId,
                grade_id: gradeId,
                section_id: sectionId ?? undefined,
                school_id: schoolId,
                academic_year_id: academicYearId,
              },
            }),
          ),
        );
        return NextResponse.json({ items: created });
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subjectId, gradeId, sectionId, schoolId, academicYearId, name, weight, period } =
      body;

    if (!subjectId || !name || weight == null) {
      return NextResponse.json(
        { error: "subjectId, name y weight requeridos" },
        { status: 400 },
      );
    }

    const item = await db.grade_items.create({
      data: {
        subject_id: subjectId,
        grade_id: gradeId,
        section_id: sectionId ?? null,
        school_id: schoolId,
        academic_year_id: academicYearId,
        name,
        weight,
        period: period ?? "TRIMESTRE_1",
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
