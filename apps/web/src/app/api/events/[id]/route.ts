import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await db.events.update({ where: { id: (await params).id }, data: { deleted_at: new Date() } });
  return NextResponse.json({ success: true });
}
