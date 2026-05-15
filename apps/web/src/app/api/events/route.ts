import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function GET() {
  const ctx = await getApiContext();
  const items = await db.events.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { start_date: "asc" },
    take: 50,
  });
  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  const ctx = await getApiContext();
  const body = await request.json();
  if (!body.title || !body.start_date) return NextResponse.json({ success: false, error: "Título y fecha requeridos" }, { status: 400 });
  const event = await db.events.create({
    data: { title: body.title, description: body.description, start_date: new Date(body.start_date), end_date: new Date(body.end_date || body.start_date), target: body.target ?? "TODOS", school_id: ctx.schoolId, created_by: ctx.userId },
  });
  return NextResponse.json({ success: true, data: event }, { status: 201 });
}
