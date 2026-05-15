import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";
import PDFDocument from "pdfkit";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: "studentId requerido" }, { status: 400 });
    }

    const student = await db.students.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });
    const academicYear = await db.academic_years.findFirst({
      where: { school_id: ctx.schoolId, is_active: true },
    });

    const doc = new PDFDocument({ size: "A4", margin: 60 });

    // Decorative border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke("#1E3A5F");

    // Header
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#1E3A5F")
      .text(school?.name ?? "Colegio", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica").fillColor("#475569")
      .text("Certificado Académico", { align: "center" });
    doc.moveDown(1);

    // Decorative line
    doc.moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y).stroke("#CBD5E1");
    doc.moveDown(1);

    // Body
    doc.fontSize(12).font("Helvetica").fillColor("#0F172A")
      .text(`El Colegio ${school?.name ?? ""} certifica que:`, { align: "center" });
    doc.moveDown(0.8);

    doc.fontSize(16).font("Helvetica-Bold")
      .text(`${student.first_name} ${student.last_name}`, { align: "center" });
    doc.moveDown(0.5);

    const genderText = student.gender === "M" ? "del alumno" : student.gender === "F" ? "de la alumna" : "del/la estudiante";
    doc.fontSize(11).font("Helvetica")
      .text(
        `Con documento ${student.document_type ?? ""} ${student.document_number ?? "—"}, ${genderText}, ha cursado satisfactoriamente el año lectivo ${academicYear?.year_label ?? "—"} en esta institución.`,
        { align: "center", width: 400 },
        );
    doc.moveDown(1.5);

    // Get enrollment for this student
    const enrollment = await db.enrollments.findFirst({
      where: { student_id: studentId, academic_year_id: academicYear?.id, deleted_at: null },
      include: { grade: true, section: true },
    });

    if (enrollment) {
      doc.fontSize(12).text(`Curso: ${enrollment.grade.name} ${enrollment.section.name}`, { align: "center" });
      doc.moveDown(0.5);
    }

    doc.fontSize(10).fillColor("#475569")
      .text(`Expedido el ${new Date().toLocaleDateString("es-ES", { dateStyle: "long" })}`, { align: "center" });

    doc.moveDown(2);

    // Signatures
    const sigY = doc.y + 10;
    doc.fillColor("#0F172A").fontSize(10);
    doc.text("_________________________", 100, sigY, { align: "center" });
    doc.text("Director", 100, sigY + 15, { align: "center" });

    doc.text("_________________________", 300, sigY, { align: "center" });
    doc.text("Secretaría", 300, sigY + 15, { align: "center" });

    // Sello placeholder
    doc.moveDown(3);
    doc.fontSize(8).fillColor("#94A3B8").text("[Sello digital del colegio]", { align: "center" });

    doc.end();

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
