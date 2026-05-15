import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";
import { generateBoletinPDF } from "@/modules/reports/boletin-pdf";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    const { sectionId } = await request.json();

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId requerido" }, { status: 400 });
    }

    const section = await db.sections.findUnique({
      where: { id: sectionId },
      include: { grade: true },
    });
    if (!section) return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });

    const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });

    const academicYear = await db.academic_years.findFirst({
      where: { school_id: ctx.schoolId, is_active: true },
    });

    const enrollments = await db.enrollments.findMany({
      where: { section_id: sectionId, academic_year_id: academicYear?.id, deleted_at: null, is_active: true },
      include: { student: true, grade: true, section: true },
    });

    const gradeItems = await db.grade_items.findMany({
      where: { grade_id: section.grade_id, deleted_at: null },
      orderBy: { name: "asc" },
    });

    const allGrades = await db.student_grades.findMany({
      where: {
        student_id: { in: enrollments.map((e) => e.student_id) },
        grade_item_id: { in: gradeItems.map((gi) => gi.id) },
        deleted_at: null,
      },
      include: { grade_item: true },
    });

    const doc = generateBoletinPDF(
      `${section.grade.name} ${section.name}`,
      school?.name ?? "Colegio",
      academicYear?.year_label ?? "—",
      enrollments,
      gradeItems,
      allGrades,
    );

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="boletin-${section.grade.name}-${section.name}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
