import { NextResponse } from "next/server";
import { db } from "@insti/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [enrollments, studentGrades, attendances, behaviorReports] = await Promise.all([
      db.enrollments.findMany({
        where: { student_id: id, deleted_at: null },
        include: { grade: true, section: true, academic_year: true },
        orderBy: { academic_year: { start_date: "desc" } },
      }),
      db.student_grades.findMany({
        where: { student_id: id, deleted_at: null },
        include: { grade_item: { include: { subject: true } }, academic_year: true },
        orderBy: { academic_year: { start_date: "desc" } },
      }),
      db.attendances.findMany({
        where: { student_id: id, deleted_at: null },
        include: { academic_year: true },
        orderBy: { date: "desc" },
        take: 365,
      }),
      db.behavior_reports.findMany({
        where: { student_id: id, deleted_at: null },
        include: { academic_year: true },
        orderBy: { created_at: "desc" },
      }),
    ]);

    // Group grades by academic year
    const gradesByYear: Record<string, { yearLabel: string; subjects: Record<string, { subjectName: string; items: { name: string; period: string; score: number | null }[] }> }> = {};
    for (const g of studentGrades) {
      const yid = g.academic_year_id;
      if (!gradesByYear[yid]) gradesByYear[yid] = { yearLabel: g.academic_year.year_label, subjects: {} };
      const sname = g.grade_item.subject.name;
      if (!gradesByYear[yid].subjects[sname]) gradesByYear[yid].subjects[sname] = { subjectName: sname, items: [] };
      gradesByYear[yid].subjects[sname].items.push({ name: g.grade_item.name, period: g.grade_item.period, score: g.score ? Number(g.score) : null });
    }

    // Attendance summary by year
    const attendanceByYear: Record<string, { yearLabel: string; presente: number; ausente: number; tardanza: number }> = {};
    for (const a of attendances) {
      const yid = a.academic_year_id;
      if (!attendanceByYear[yid]) attendanceByYear[yid] = { yearLabel: a.academic_year.year_label, presente: 0, ausente: 0, tardanza: 0 };
      if (a.status === "PRESENTE") attendanceByYear[yid].presente++;
      else if (a.status === "AUSENTE") attendanceByYear[yid].ausente++;
      else if (a.status === "TARDANZA") attendanceByYear[yid].tardanza++;
    }

    // Behavior by year
    const behaviorByYear: Record<string, { yearLabel: string; reports: { type: string; severity: string | null; description: string; date: string }[] }> = {};
    for (const b of behaviorReports) {
      const yid = b.academic_year_id;
      if (!behaviorByYear[yid]) behaviorByYear[yid] = { yearLabel: b.academic_year.year_label, reports: [] };
      behaviorByYear[yid].reports.push({ type: b.type, severity: b.severity, description: b.description, date: b.created_at.toISOString() });
    }

    return NextResponse.json({
      success: true,
      data: { enrollments, gradesByYear, attendanceByYear, behaviorByYear },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
