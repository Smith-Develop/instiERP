import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { guardianSchema } from "@/modules/guardians/schemas";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guardian = await db.guardians.findUnique({ where: { id, deleted_at: null } });
  if (!guardian) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ success: true, data: guardian });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = guardianSchema.partial().parse(body);
    const guardian = await db.guardians.update({ where: { id }, data: { ...parsed, email: parsed.email || null } });
    return NextResponse.json({ success: true, data: guardian });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.guardians.update({ where: { id }, data: { deleted_at: new Date() } });
  return NextResponse.json({ success: true });
}
