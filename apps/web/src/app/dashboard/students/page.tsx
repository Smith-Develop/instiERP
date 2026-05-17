import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { StudentTable } from "@/modules/students/table";
import { NewStudentButton } from "@/modules/students/new-student-button";

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const ctx = await getSessionContext();
  const sp = await searchParams;
  const search = sp.search || "";
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 20;

  const where: Record<string, unknown> = {
    school_id: ctx.schoolId,
    deleted_at: null,
  };

  if (search) {
    where.OR = [
      { first_name: { contains: search, mode: "insensitive" } },
      { last_name: { contains: search, mode: "insensitive" } },
      { document_number: { contains: search, mode: "insensitive" } },
    ];
  }

  const [students, total] = await Promise.all([
    db.students.findMany({
      where: where as never,
      include: {
        enrollments: {
          where: { academic_year_id: ctx.academicYearId, deleted_at: null },
          include: { grade: true, section: true },
        },
      },
      orderBy: { last_name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.students.count({ where: where as never }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Estudiantes</h2>
          <p className="text-sm text-slate-500">{total} registrados</p>
        </div>
        <NewStudentButton />
      </div>

      <StudentTable students={students} search={search} page={page} totalPages={totalPages} />
    </div>
  );
}
