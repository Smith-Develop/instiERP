import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.COMMUNICATION_READ);
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { school_id: ctx.schoolId, deleted_at: null };

  if (from && to) {
    where.OR = [
      { start_date: { gte: new Date(from), lte: new Date(to) } },
      { end_date: { gte: new Date(from), lte: new Date(to) } },
    ];
  }

  const items = await db.events.findMany({
    where: where as never,
    orderBy: { start_date: "asc" },
    take: 200,
  });
  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.COMMUNICATION_WRITE);
  const body = await request.json();
  if (!body.title || !body.start_date) return NextResponse.json({ success: false, error: "Título y fecha requeridos" }, { status: 400 });
  const event = await db.events.create({
    data: { title: body.title, description: body.description, start_date: new Date(body.start_date), end_date: new Date(body.end_date || body.start_date), target: body.target ?? "TODOS", school_id: ctx.schoolId, created_by: ctx.userId },
  });
  return NextResponse.json({ success: true, data: event }, { status: 201 });
}
