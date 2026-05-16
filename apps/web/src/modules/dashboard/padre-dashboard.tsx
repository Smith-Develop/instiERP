import { db } from "@insti/database";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { GraduationCap, ClipboardCheck, Banknote, TrendingUp } from "lucide-react";

interface Props { schoolId: string; academicYearId: string; userId: string }

export async function PadreDashboard({ schoolId, academicYearId, userId }: Props) {
  // Find the parent's guardian record
  const guardian = await db.guardians.findFirst({ where: { user_id: userId, school_id: schoolId, deleted_at: null } });
  if (!guardian) return <p className="text-sm text-slate-400">No se encontró perfil de padre/tutor.</p>;

  // Get their children
  const studentLinks = await db.student_guardians.findMany({
    where: { guardian_id: guardian.id, deleted_at: null },
    include: { student: true },
  });

  const studentIds = studentLinks.map(s => s.student_id);

  const [enrollments, invoices] = await Promise.all([
    db.enrollments.findMany({
      where: { student_id: { in: studentIds }, academic_year_id: academicYearId, deleted_at: null },
      include: { grade: true, section: true },
    }),
    db.invoices.findMany({
      where: { student_id: { in: studentIds }, school_id: schoolId, deleted_at: null },
      orderBy: { due_date: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Panel de Familia</h2>
      {studentLinks.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-400">No hay estudiantes vinculados a tu cuenta.</p></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {studentLinks.map((link) => {
            const enrollment = enrollments.find(e => e.student_id === link.student.id);
            const studentInvoices = invoices.filter(i => i.student_id === link.student.id);
            const pendingAmount = studentInvoices.filter(i => i.status === "PENDIENTE").reduce((s, i) => s + Number(i.amount), 0);

            return (
              <Card key={link.student.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{link.student.first_name} {link.student.last_name}</CardTitle>
                    {enrollment && <span className="text-sm text-slate-500">{enrollment.grade.name} {enrollment.section.name}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-4">
                    {[
                      { label: "Curso", value: enrollment ? `${enrollment.grade.name} ${enrollment.section.name}` : "Sin matrícula", icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
                      { label: "Asistencia", value: "Ver", icon: ClipboardCheck, color: "text-emerald-600 bg-emerald-50", href: "/dashboard/attendance" },
                      { label: "Pagos pendientes", value: pendingAmount > 0 ? `${pendingAmount.toFixed(0)}€` : "Al día", icon: Banknote, color: pendingAmount > 0 ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50" },
                      { label: "Rendimiento", value: "Ver", icon: TrendingUp, color: "text-purple-600 bg-purple-50", href: `/dashboard/reports/${link.student.id}` },
                    ].map(item => {
                      const content = (
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${item.color}`}><item.icon className="h-4 w-4"/></div>
                          <div><p className="text-sm font-medium text-slate-900">{item.value}</p><p className="text-xs text-slate-500">{item.label}</p></div>
                        </div>
                      );
                      return item.href ? <a key={item.label} href={item.href} className="rounded-md border px-3 py-2 hover:border-slate-300 transition-colors block">{content}</a> : <div key={item.label} className="rounded-md border px-3 py-2">{content}</div>;
                    })}
                  </div>
                  {studentInvoices.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Últimas facturas</h4>
                      <div className="space-y-1">
                        {studentInvoices.slice(0, 3).map(inv => (
                          <div key={inv.id} className="flex items-center justify-between text-sm"><span className="text-slate-500">{inv.concept}</span><span className={`font-medium ${inv.status === "PAGADO" ? "text-emerald-600" : "text-red-600"}`}>{Number(inv.amount).toFixed(0)}€</span></div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
