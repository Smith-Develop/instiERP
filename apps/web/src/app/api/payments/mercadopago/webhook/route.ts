import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "payment") {
      const paymentId = data?.id;
      if (paymentId) {
        // MercadoPago sends payment ID, we query it to get details
        // For now, just check if the payment exists and update accordingly
        const payment = await db.payments.findFirst({
          where: { transaction_id: String(paymentId) },
        });
        if (!payment) {
          // Look up the invoice by external_reference
          // This is simplified — in production, verify with MP API
          const invoiceId = body.resource ?? body.external_reference;
          if (invoiceId) {
            await db.invoices.update({
              where: { id: invoiceId },
              data: { status: "PAGADO", paid_at: new Date() },
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
