import { NextRequest, NextResponse } from "next/server";
import { db } from "@insti/database";
import { getApiContext, guard } from "@/lib/api-context";
import { PERMISSIONS } from "@insti/auth";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getApiContext();
    guard(ctx, PERMISSIONS.PAYMENTS_WRITE);

    const { invoiceId } = await request.json();
    if (!invoiceId) return NextResponse.json({ error: "invoiceId requerido" }, { status: 400 });

    const invoice = await db.invoices.findUnique({
      where: { id: invoiceId, school_id: ctx.schoolId, deleted_at: null },
    });
    if (!invoice) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    if (invoice.status === "PAGADO") return NextResponse.json({ error: "Ya está pagada" }, { status: 400 });

    const school = await db.schools.findUnique({ where: { id: ctx.schoolId } });
    if (!school?.mp_access_token) return NextResponse.json({ error: "MercadoPago no configurado" }, { status: 400 });

    const client = new MercadoPagoConfig({ accessToken: school.mp_access_token });
    const preference = new Preference(client);

    const origin = request.headers.get("origin") ?? "http://localhost:3000";
    const result = await preference.create({
      body: {
        items: [{
          id: invoice.id,
          title: invoice.concept,
          quantity: 1,
          unit_price: Number(invoice.amount),
          currency_id: (school.currency || "EUR").toUpperCase(),
        }],
        back_urls: {
          success: `${origin}/dashboard/finance?paid=true`,
          failure: `${origin}/dashboard/finance?cancelled=true`,
        },
        external_reference: invoice.id,
        metadata: { schoolId: ctx.schoolId, payerId: ctx.userId },
        auto_return: "approved",
      },
    });

    return NextResponse.json({ success: true, data: { url: result.init_point } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
