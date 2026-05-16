import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { AnalyticsView } from "@/modules/analytics/analytics-view";

export default async function AnalyticsPage() {
  const ctx = await getSessionContext();

  // Grade distribution: count students per grade
  const grades = await db.grades.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: {
      enrollments: { where: { academic_year_id: ctx.academicYearId, deleted_at: null } },
    },
    orderBy: { sort_order: "asc" },
  });

  const gradeData = grades.map(g => ({ name: g.name, students: g.enrollments.length }));

  // Attendance last 7 days
  const last7Days: { date: string; presente: number; ausente: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const records = await db.attendances.findMany({
      where: { school_id: ctx.schoolId, date: { gte: d, lt: next }, deleted_at: null },
    });
    last7Days.push({
      date: d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
      presente: records.filter(r => r.status === "PRESENTE").length,
      ausente: records.filter(r => r.status === "AUSENTE").length,
    });
  }

  // Finance: monthly totals
  const invoices = await db.invoices.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    select: { amount: true, status: true, created_at: true },
  });

  const monthlyFinance: { month: string; ingresos: number; pendiente: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = m.toLocaleDateString("es-ES", { month: "short" });
    const monthInvoices = invoices.filter(inv => {
      const d = new Date(inv.created_at);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    });
    monthlyFinance.push({
      month: label,
      ingresos: monthInvoices.filter(inv => inv.status === "PAGADO").reduce((s, inv) => s + Number(inv.amount), 0),
      pendiente: monthInvoices.filter(inv => inv.status === "PENDIENTE").reduce((s, inv) => s + Number(inv.amount), 0),
    });
  }

  // Student performance: average scores by grade
  const allScores = await db.student_grades.findMany({
    where: { academic_year_id: ctx.academicYearId, deleted_at: null },
    include: { grade_item: { select: { grade_id: true, name: true } } },
  });

  const performanceByGrade: { name: string; promedio: number }[] = [];
  for (const g of grades) {
    const gScores = allScores.filter(s => s.grade_item.grade_id === g.id).filter(s => s.score != null);
    const avg = gScores.length > 0 ? gScores.reduce((sum, s) => sum + Number(s.score), 0) / gScores.length : 0;
    performanceByGrade.push({ name: g.name, promedio: Math.round(avg * 10) / 10 });
  }

  // KPIs
  const [totalStudents, totalTeachers, pendingInvoicesCount, activeEnrollments] = await Promise.all([
    db.students.count({ where: { school_id: ctx.schoolId, deleted_at: null } }),
    db.teachers.count({ where: { school_id: ctx.schoolId, deleted_at: null } }),
    db.invoices.count({ where: { school_id: ctx.schoolId, status: "PENDIENTE", deleted_at: null } }),
    db.enrollments.count({ where: { school_id: ctx.schoolId, academic_year_id: ctx.academicYearId, deleted_at: null } }),
  ]);

  const todayAttendance = await db.attendances.findMany({
    where: { school_id: ctx.schoolId, date: { gte: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })(), lt: (() => { const d = new Date(); d.setHours(23,59,59,999); return d; })() }, deleted_at: null },
  });
  const attendanceRate = todayAttendance.length > 0 ? Math.round((todayAttendance.filter(a => a.status === "PRESENTE").length / todayAttendance.length) * 100) : 0;

  return (
    <AnalyticsView
      gradeData={gradeData}
      attendanceData={last7Days}
      financeData={monthlyFinance}
      performanceData={performanceByGrade}
      kpis={{ totalStudents, totalTeachers, pendingInvoicesCount, activeEnrollments, attendanceRate }}
    />
  );
}
