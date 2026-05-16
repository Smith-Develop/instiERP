import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default async function ClassroomPage() {
  const ctx = await getSessionContext();

  // For teachers: show assigned sections
  const teacher = await db.teachers.findFirst({ where: { user_id: ctx.userId, school_id: ctx.schoolId } });

  // For students: show enrolled sections
  const student = await db.students.findFirst({ where: { user_id: ctx.userId, school_id: ctx.schoolId } });

  if (teacher) {
    const assignments = await db.teacher_assignments.findMany({
      where: { teacher_id: teacher.id, deleted_at: null },
      include: { section: { select: { id: true, name: true } }, grade: { select: { name: true } }, subject: { select: { name: true } } },
    });

    // Group by section
    const sections = new Map<string, { id: string; label: string; subjects: string[] }>();
    for (const a of assignments) {
      if (a.section_id) {
        if (!sections.has(a.section_id)) {
          sections.set(a.section_id, { id: a.section_id, label: `${a.grade.name} ${a.section?.name ?? ""}`, subjects: [] });
        }
        sections.get(a.section_id)!.subjects.push(a.subject.name);
      }
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Aula Virtual</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...sections.values()].map(s => (
            <Link key={s.id} href={`/dashboard/classroom/${s.id}`}>
              <Card className="h-full hover:border-slate-300 transition-colors">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><BookOpen className="h-5 w-5"/></div>
                  <CardTitle className="text-base">{s.label}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-slate-500">{s.subjects.join(", ")}</p></CardContent>
              </Card>
            </Link>
          ))}
          {sections.size === 0 && <p className="text-sm text-slate-400 col-span-full">No tienes secciones asignadas.</p>}
        </div>
      </div>
    );
  }

  if (student) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Mis Tareas</h2>
        <p className="text-sm text-slate-500">Redirigiendo a tu panel de estudiante...</p>
        <meta httpEquiv="refresh" content="0;url=/dashboard/classroom/student" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Aula Virtual</h2>
      <Card><CardContent className="py-8 text-center text-sm text-slate-400">No tienes perfil de profesor ni estudiante vinculado.</CardContent></Card>
    </div>
  );
}
