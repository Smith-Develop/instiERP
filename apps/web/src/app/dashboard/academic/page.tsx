import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { AcademicView } from "@/modules/academic/academic-view";

export default async function AcademicPage() {
  const ctx = await getSessionContext();
  const levels = await db.academic_levels.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: {
      grades: {
        where: { deleted_at: null },
        include: { sections: { where: { deleted_at: null }, orderBy: { name: "asc" } } },
        orderBy: { sort_order: "asc" },
      },
    },
    orderBy: { sort_order: "asc" },
  });

  return <AcademicView levels={JSON.parse(JSON.stringify(levels))} />;
}
