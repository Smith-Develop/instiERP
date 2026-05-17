import { NextResponse } from "next/server";
import { db } from "@insti/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const enrollments = await db.enrollments.findMany({
      where: { section_id: id, deleted_at: null },
      include: { student: true },
      orderBy: { student: { last_name: "asc" } },
    });
    return NextResponse.json({
      success: true,
      data: enrollments.map(e => e.student),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
