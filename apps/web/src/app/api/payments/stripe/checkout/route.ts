import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.PAYMENTS_WRITE);

    const { invoiceId } = await request.json();
    if (!invoiceId) return NextResponse.json({ error: "invoiceId requerido" }, { status: 400 });

    const invoice = await db.invoices.findUnique({
      where: { id: invoiceId, school_id: ctx.schoolId, deleted_at: null },
      include: { student: { select: { first_name: true, last_name: true } } },
    });
    if (!invoice) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    if (invoice.status === "PAGADO") return NextResponse.json({ error: "Ya está pagada" }, { status: 400 });

    const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });
    if (!school?.stripe_secret) return NextResponse.json({ error: "Stripe no configurado para este colegio" }, { status: 400 });

    const stripe = new Stripe(school.stripe_secret);
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: school.currency.toLowerCase(),
          product_data: { name: invoice.concept },
          unit_amount: Math.round(Number(invoice.amount) * 100), // Stripe works in cents
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/dashboard/finance?paid=true`,
      cancel_url: `${origin}/dashboard/finance?cancelled=true`,
      metadata: { invoiceId: invoice.id, schoolId: ctx.schoolId, payerId: ctx.userId },
    });

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
