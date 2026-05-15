import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db.subjects.findUnique({ where: { id, deleted_at: null } });
  return s ? NextResponse.json({ success: true, data: s }) : NextResponse.json({ success: false, error: "No encontrada" }, { status: 404 });
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const s = await db.subjects.update({ where: { id }, data: { name: body.name, code: body.code, description: body.description } });
  return NextResponse.json({ success: true, data: s });
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.subjects.update({ where: { id }, data: { deleted_at: new Date() } });
  return NextResponse.json({ success: true });
}
