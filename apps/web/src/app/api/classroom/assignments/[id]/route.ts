import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.ASSIGNMENTS_WRITE);
    const { id } = await params;
    const body = await request.json();

    const assignment = await db.classroom_assignments.update({
      where: { id, school_id: ctx.schoolId },
      data: {
        title: body.title, description: body.description, type: body.type,
        points: body.points ? Number(body.points) : undefined, due_date: body.due_date ? new Date(body.due_date) : undefined,
        status: body.status, allow_student_posts: body.allow_student_posts,
      },
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.ASSIGNMENTS_WRITE);
    const { id } = await params;
    await db.classroom_assignments.update({ where: { id, school_id: ctx.schoolId }, data: { deleted_at: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
