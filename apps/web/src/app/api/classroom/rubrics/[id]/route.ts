import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.rubrics.update({ where: { id }, data: { deleted_at: new Date() } });
  return NextResponse.json({ success: true });
}
