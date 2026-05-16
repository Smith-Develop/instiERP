import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ schoolId: string }> }) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.AI_WRITE);
  const { schoolId } = await params;

  const config = await db.ai_configurations.findUnique({
    where: { school_id: schoolId },
    include: { provider: true },
  });

  const providers = await db.ai_providers.findMany({ where: { is_active: true } });

  return NextResponse.json({ success: true, data: { config, providers } });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.AI_WRITE);
    const { schoolId } = await params;
    const body = await request.json();

    // Check if tokens need reset (monthly)
    const existing = await db.ai_configurations.findUnique({ where: { school_id: schoolId } });
    let tokensUsed = existing?.tokens_used ?? 0;
    if (existing?.last_reset_at && new Date().getMonth() !== existing.last_reset_at.getMonth()) {
      tokensUsed = 0;
    }

    const config = await db.ai_configurations.upsert({
      where: { school_id: schoolId },
      update: {
        provider_id: body.provider_id ?? existing?.provider_id,
        model: body.model ?? existing?.model,
        system_prompt: body.system_prompt,
        risk_threshold: body.risk_threshold ?? existing?.risk_threshold,
        max_tokens_per_month: body.max_tokens_per_month ?? existing?.max_tokens_per_month,
        tokens_used: tokensUsed,
        last_reset_at: tokensUsed === 0 ? new Date() : existing?.last_reset_at,
        features: body.features ?? existing?.features,
        chat_data_access: body.chat_data_access ?? existing?.chat_data_access,
        is_active: body.is_active ?? existing?.is_active,
      },
      create: {
        school_id: schoolId,
        provider_id: body.provider_id,
        model: body.model ?? "gemini-2.0-flash",
        system_prompt: body.system_prompt ?? null,
        risk_threshold: body.risk_threshold ?? 0.70,
        max_tokens_per_month: body.max_tokens_per_month ?? 100000,
        features: body.features ?? { predictions: true, chat: false, insights: false },
        chat_data_access: body.chat_data_access ?? false,
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
