import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";
import { generateCertificatePDF } from "@/modules/reports/certificate-pdf";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.CERTIFICATES_READ);

    const { studentId } = await request.json();
    if (!studentId) {
      return NextResponse.json({ error: "studentId requerido" }, { status: 400 });
    }

    const student = await db.students.findUnique({
      where: { id: studentId, school_id: ctx.schoolId, deleted_at: null },
    });
    if (!student) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });

    const genderText = student.gender === "M" ? "del alumno" : student.gender === "F" ? "de la alumna" : "del/la estudiante";

    const enrollment = await db.enrollments.findFirst({
      where: { student_id: studentId, school_id: ctx.schoolId, deleted_at: null },
      include: { grade: true, section: true },
    });

    const doc = generateCertificatePDF(
      school?.name ?? "Colegio",
      `${student.first_name} ${student.last_name}`,
      genderText,
      student.document_type ?? "",
      student.document_number ?? "—",
      ctx.academicYearId,
      enrollment ? `${enrollment.grade.name} ${enrollment.section.name}` : null,
    );

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificado-${student.last_name}-${student.first_name}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    const status = error instanceof Error && error.message.includes("No autorizado") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
