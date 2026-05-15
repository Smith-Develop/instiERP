import PDFDocument from "pdfkit";

export function generateCertificatePDF(
  schoolName: string,
  studentName: string,
  genderText: string,
  documentType: string,
  documentNumber: string,
  academicYearLabel: string,
  gradeLabel: string | null,
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 60 });

  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke("#1E3A5F");

  doc.fontSize(20).font("Helvetica-Bold").fillColor("#1E3A5F")
    .text(schoolName, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(14).font("Helvetica").fillColor("#475569")
    .text("Certificado Académico", { align: "center" });
  doc.moveDown(1);

  doc.moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y).stroke("#CBD5E1");
  doc.moveDown(1);

  doc.fontSize(12).font("Helvetica").fillColor("#0F172A")
    .text(`El Colegio ${schoolName} certifica que:`, { align: "center" });
  doc.moveDown(0.8);

  doc.fontSize(16).font("Helvetica-Bold").text(studentName, { align: "center" });
  doc.moveDown(0.5);

  doc.fontSize(11).font("Helvetica")
    .text(
      `Con documento ${documentType} ${documentNumber}, ${genderText}, ha cursado satisfactoriamente el año lectivo ${academicYearLabel} en esta institución.`,
      { align: "center", width: 400 },
    );

  if (gradeLabel) {
    doc.moveDown(1);
    doc.fontSize(12).text(`Curso: ${gradeLabel}`, { align: "center" });
  }

  doc.moveDown(1);
  doc.fontSize(10).fillColor("#475569")
    .text(`Expedido el ${new Date().toLocaleDateString("es-ES", { dateStyle: "long" })}`, { align: "center" });

  doc.moveDown(2);
  const sigY = doc.y + 10;
  doc.fillColor("#0F172A").fontSize(10);
  doc.text("_________________________", 100, sigY, { align: "center" });
  doc.text("Director", 100, sigY + 15, { align: "center" });
  doc.text("_________________________", 300, sigY, { align: "center" });
  doc.text("Secretaría", 300, sigY + 15, { align: "center" });
  doc.moveDown(3);
  doc.fontSize(8).fillColor("#94A3B8").text("[Sello digital del colegio]", { align: "center" });

  doc.end();
  return doc;
}
