import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { ClassroomView } from "@/modules/classroom/classroom-view";

interface PageProps { params: Promise<{ sectionId: string }> }

export default async function ClassroomSectionPage({ params }: PageProps) {
  const { sectionId } = await params;
  const ctx = await getSessionContext();

  const section = await db.sections.findUnique({ where: { id: sectionId, school_id: ctx.schoolId }, include: { grade: true } });
  const assignments = await db.classroom_assignments.findMany({
    where: { section_id: sectionId, school_id: ctx.schoolId, deleted_at: null },
    include: { subject: { select: { name: true } }, submissions: { select: { status: true, student_id: true } } },
    orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
  });

  const posts = await db.class_posts.findMany({
    where: { section_id: sectionId, deleted_at: null },
    include: { comments: true },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  const enrollments = await db.enrollments.findMany({
    where: { section_id: sectionId, academic_year_id: ctx.academicYearId, deleted_at: null, is_active: true },
    select: { student_id: true },
  });

  return (
    <ClassroomView
      sectionId={sectionId}
      sectionLabel={section ? `${section.grade.name} ${section.name}` : ""}
      assignments={assignments}
      posts={posts.map(p => ({...p, authorName: "", comments: p.comments.map(c => ({...c, authorName: ""}))}))}
      studentCount={enrollments.length}
    />
  );
}
