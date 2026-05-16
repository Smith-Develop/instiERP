import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.FINANCE_READ);
  const plans = await db.billing_plans.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { student_plans: { where: { deleted_at: null, is_active: true }, select: { id: true, student_id: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ success: true, data: { items: plans } });
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.FINANCE_WRITE);
    const body = await request.json();
    if (!body.name || body.amount == null) return NextResponse.json({ error: "name y amount requeridos" }, { status: 400 });

    const plan = await db.billing_plans.create({
      data: {
        school_id: ctx.schoolId, name: body.name, amount: body.amount,
        currency: body.currency ?? "EUR", frequency: body.frequency ?? "MONTHLY",
        due_day: body.due_day ?? 1,
      },
    });
    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
