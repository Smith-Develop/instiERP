import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";

export async function GET() {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.FINANCE_READ);
  const items = await db.invoices.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { student: { select: { first_name: true, last_name: true } } },
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return NextResponse.json({ success: true, data: { items } });
}

export async function POST(request: NextRequest) {
  const ctx = await getApiContext();
  guard(ctx, PERMISSIONS.FINANCE_WRITE);
  const body = await request.json();
  if (!body.student_id || !body.concept || !body.amount) return NextResponse.json({ success: false, error: "Datos incompletos" }, { status: 400 });
  const invoice = await db.invoices.create({
    data: {
      student_id: body.student_id, concept: body.concept, amount: body.amount, currency: "EUR",
      school_id: ctx.schoolId, academic_year_id: body.academic_year_id || ctx.userId, status: "PENDIENTE",
      due_date: body.due_date ? new Date(body.due_date) : new Date(Date.now() + 30*86400000),
    },
  });
  return NextResponse.json({ success: true, data: invoice }, { status: 201 });
}
