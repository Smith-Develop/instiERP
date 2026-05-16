import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.AI_WRITE);
    const { id } = await params;
    const body = await request.json();

    if (body.is_default) {
      await db.ai_providers.updateMany({ where: { is_default: true }, data: { is_default: false } });
    }

    const provider = await db.ai_providers.update({
      where: { id },
      data: {
        api_key: body.api_key, models: body.models, base_url: body.base_url,
        is_default: body.is_default, is_active: body.is_active,
      },
    });
    return NextResponse.json({ success: true, data: provider });
  } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.AI_WRITE);
  const { id } = await params;
  await db.ai_providers.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
