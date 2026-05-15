import PDFDocument from "pdfkit";
import type { Prisma } from "@insti/database";

type StudentRecord = { id: string; first_name: string; last_name: string };
type GradeItemRecord = { id: string; name: string; weight: Prisma.Decimal };
type GradeRecord = { student_id: string; grade_item_id: string; score: Prisma.Decimal | null; grade_item: GradeItemRecord };
type EnrollmentRecord = { student: StudentRecord; grade: { name: string }; section: { name: string } };

export function generateBoletinPDF(
  sectionLabel: string,
  schoolName: string,
  academicYear: string,
  enrollments: EnrollmentRecord[],
  allGradeItems: GradeItemRecord[],
  allGrades: GradeRecord[],
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 50, layout: "landscape" });

  // Build student data
  const studentsData = enrollments.map((enr) => {
    const studentGrades = allGrades.filter((g) => g.student_id === enr.student.id);
    const items = allGradeItems.map((gi) => {
      const sg = studentGrades.find((g) => g.grade_item_id === gi.id);
      return sg?.score ? Number(sg.score).toFixed(1) : "—";
    });
    const validScores = items.filter((i) => i !== "—").map(Number);
    const avg = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2) : "—";
    return {
      name: `${enr.student.last_name}, ${enr.student.first_name}`,
      items,
      avg,
    };
  });

  const colWidths = [180, ...allGradeItems.map(() => 60), 50];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = (doc.page.width - tableWidth) / 2;

  // Header
  doc.fontSize(16).font("Helvetica-Bold").text(schoolName, { align: "center" });
  doc.fontSize(11).font("Helvetica").text(`Boletín de Calificaciones — ${sectionLabel}`, { align: "center" });
  doc.fontSize(9).text(`Año Lectivo: ${academicYear}`, { align: "center" });
  doc.moveDown(0.8);

  // Header row
  const headerY = doc.y;
  let x = startX;
  doc.fontSize(7).font("Helvetica-Bold");
  doc.rect(startX, headerY - 2, tableWidth, 16).fill("#1E3A5F");
  doc.fillColor("white");
  [["Estudiante", colWidths[0]!], ...allGradeItems.map((gi, i) => [gi.name, colWidths[i + 1]!] as [string, number]), ["Promedio", colWidths[colWidths.length - 1]!]].forEach(([label, w]) => {
    doc.text(label as string, x + 3, headerY + 3, { width: w as number, align: "center" });
    x += w as number;
  });
  doc.fillColor("black");

  // Data rows
  doc.font("Helvetica").fontSize(7);
  let rowY = headerY + 18;
  studentsData.forEach((st, idx) => {
    // Alternating row background
    if (idx % 2 === 0) {
      doc.rect(startX, rowY - 2, tableWidth, 14).fill("#F8FAFC");
    }
    doc.fillColor("#0F172A");
    let cx = startX;
    [[st.name, colWidths[0]!] as [string, number], ...st.items.map((item, i) => [item, colWidths[i + 1]!] as [string, number]), [st.avg, colWidths[colWidths.length - 1]!] as [string, number]].forEach(([text, w]) => {
      doc.text(text, cx + 3, rowY + 2, { width: w, align: "center" });
      cx += w;
    });
    rowY += 14;
  });

  // Footer
  doc.moveDown(2);
  const footerY = doc.y + 20;
  doc.fontSize(9).font("Helvetica");
  doc.text("Firma del Director", startX, footerY, { width: 200 });
  doc.text("Firma del Tutor", startX + 300, footerY, { width: 200 });
  doc.text("Sello del Colegio", startX + 600, footerY, { width: 150, align: "right" });

  // Lines for signatures
  [startX, startX + 300, startX + 600].forEach((sx) => {
    doc.moveTo(sx, footerY + 30).lineTo(sx + 150, footerY + 30).stroke("#94A3B8");
  });

  doc.end();
  return doc;
}
