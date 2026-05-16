import { NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext } from "@/lib/api-context";

export async function GET() {
  const ctx = await getApiContext();
  const payments = await db.payments.findMany({
    where: { payer_id: ctx.userId },
    include: { invoice: { select: { concept: true, student: { select: { first_name: true, last_name: true } } } } },
    orderBy: { created_at: "desc" },
    take: 20,
  });
  return NextResponse.json({ success: true, data: { items: payments } });
}
