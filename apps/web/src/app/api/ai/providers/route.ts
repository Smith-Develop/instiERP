import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.AI_WRITE);
  const items = await db.ai_providers.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.AI_WRITE);
    const body = await request.json();
    if (!body.name || !body.api_key || !body.models) {
      return NextResponse.json({ error: "name, api_key y models requeridos" }, { status: 400 });
    }

    // If this is set as default, unset others
    if (body.is_default) {
      await db.ai_providers.updateMany({ where: { is_default: true }, data: { is_default: false } });
    }

    const provider = await db.ai_providers.create({
      data: {
        name: body.name,
        api_key: body.api_key,
        base_url: body.base_url ?? null,
        models: body.models,
        is_default: body.is_default ?? false,
      },
    });

    return NextResponse.json({ success: true, data: provider }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
