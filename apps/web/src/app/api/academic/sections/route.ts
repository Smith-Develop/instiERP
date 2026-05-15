import { NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function GET() {
  const ctx = await getApiContext();
  const sections = await db.sections.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { grade: true },
    orderBy: [{ grade: { sort_order: "asc" } }, { sort_order: "asc" }],
  });
  return NextResponse.json({
    success: true,
    data: sections.map(s => ({ id: s.id, label: `${s.grade.name} ${s.name}`, gradeId: s.grade_id, gradeName: s.grade.name })),
  });
}
