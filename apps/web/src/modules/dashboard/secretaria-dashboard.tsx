import { db } from "@insti/database";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { Users, UserPlus, Banknote, BookOpen } from "lucide-react";

interface Props { schoolId: string; academicYearId: string }

export async function SecretariaDashboard({ schoolId, academicYearId }: Props) {
  const [studentCount, pendingAdmissions, pendingInvoices, recentEnrollments] = await Promise.all([
    db.students.count({ where: { school_id: schoolId, deleted_at: null } }),
    db.admissions.count({ where: { school_id: schoolId, status: "PENDIENTE", deleted_at: null } }),
    db.invoices.count({ where: { school_id: schoolId, status: "PENDIENTE", deleted_at: null } }),
    db.enrollments.findMany({ where: { school_id: schoolId, academic_year_id: academicYearId, deleted_at: null }, orderBy: { created_at: "desc" }, take: 5, include: { student: { select: { first_name: true, last_name: true, document_number: true } }, grade: true, section: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Panel de Secretaría</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Estudiantes activos", value: studentCount, icon: Users, color: "text-blue-600 bg-blue-50", href: "/dashboard/students" },
          { label: "Admisiones pendientes", value: pendingAdmissions, icon: UserPlus, color: pendingAdmissions > 0 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50", href: "/dashboard/admissions" },
          { label: "Pagos pendientes", value: pendingInvoices, icon: Banknote, color: pendingInvoices > 0 ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50", href: "/dashboard/finance" },
          { label: "Año activo", value: "2026-27", icon: BookOpen, color: "text-purple-600 bg-purple-50", href: "/dashboard/academic" },
        ].map(kpi => (
          <a key={kpi.label} href={kpi.href}>
            <Card className="hover:border-slate-300 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}><kpi.icon className="h-5 w-5"/></div>
                  <div><p className="text-2xl font-bold text-slate-900">{typeof kpi.value === "number" ? kpi.value : kpi.value}</p><p className="text-xs text-slate-500">{kpi.label}</p></div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
      <Card><CardHeader><CardTitle>Últimas matrículas</CardTitle></CardHeader><CardContent>{recentEnrollments.length > 0 ? <div className="space-y-2">{recentEnrollments.map(e => <div key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2"><span className="text-sm font-medium">{e.student.last_name}, {e.student.first_name}</span><span className="text-xs text-slate-500">{e.grade.name} {e.section.name}</span></div>)}</div> : <p className="text-sm text-slate-400">Sin matrículas.</p>}</CardContent></Card>
    </div>
  );
}
