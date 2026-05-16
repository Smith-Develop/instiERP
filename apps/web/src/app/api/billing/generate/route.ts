import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.FINANCE_WRITE);

    const { month, year } = await request.json();
    const now = new Date();
    const targetMonth = month ?? now.getMonth(); // 0-based
    const targetYear = year ?? now.getFullYear();

    // Get active student billing plans
    const studentPlans = await db.student_billing_plans.findMany({
      where: { school_id: ctx.schoolId, is_active: true, deleted_at: null },
      include: { plan: true, student: { select: { id: true, first_name: true, last_name: true } } },
    });

    let generated = 0;
    const periodLabel = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;

    for (const sp of studentPlans) {
      if (!sp.plan.is_active) continue;

      // Check if invoice already exists for this period
      const existing = await db.invoices.findFirst({
        where: {
          student_id: sp.student_id,
          concept: { startsWith: `${sp.plan.name} - ${periodLabel}` },
          school_id: ctx.schoolId,
          deleted_at: null,
        },
      });
      if (existing) continue;

      const dueDate = new Date(targetYear, targetMonth, sp.plan.due_day);

      await db.invoices.create({
        data: {
          school_id: ctx.schoolId,
          academic_year_id: ctx.academicYearId,
          student_id: sp.student_id,
          concept: `${sp.plan.name} - ${periodLabel}`,
          amount: sp.plan.amount,
          currency: sp.plan.currency,
          status: "PENDIENTE",
          due_date: dueDate,
        },
      });
      generated++;
    }

    return NextResponse.json({ success: true, data: { generated, period: periodLabel } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
