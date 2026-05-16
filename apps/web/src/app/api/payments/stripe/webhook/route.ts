import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature")!;
  const body = await request.text();

  // Get the first school that has Stripe configured (webhook is school-agnostic)
  const school = await db.schools.findFirst({
    where: { stripe_secret: { not: null }, deleted_at: null },
  });

  if (!school?.stripe_secret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  try {
    const stripe = new Stripe(school.stripe_secret);
    // Use the school's stripe secret + a random endpoint secret placeholder
    // In production, store webhookSecret per school
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata as { invoiceId: string; schoolId: string; payerId: string } | null;
      if (metadata) {
        // Create payment record
        await db.payments.create({
          data: {
            school_id: metadata.schoolId,
            invoice_id: metadata.invoiceId,
            payer_id: metadata.payerId,
            amount: (session.amount_total ?? 0) / 100,
            currency: (session.currency ?? "eur").toUpperCase(),
            method: "STRIPE",
            transaction_id: session.id,
            status: "COMPLETADO",
          },
        });

        // Mark invoice as paid
        await db.invoices.update({
          where: { id: metadata.invoiceId },
          data: { status: "PAGADO", paid_at: new Date() },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
