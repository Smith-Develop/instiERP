import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { InvoiceList } from "@/modules/invoices/invoice-list";

export default async function FinancePage() {
  const ctx = await getSessionContext();
  const [invoices, school, overdueInvoices] = await Promise.all([
    db.invoices.findMany({
      where: { school_id: ctx.schoolId, deleted_at: null },
      include: { student: { select: { first_name: true, last_name: true } }, payments: true },
      orderBy: { created_at: "desc" },
      take: 50,
    }),
    db.schools.findUnique({ where: { id: ctx.schoolId }, select: { payment_provider: true, currency: true } }),
    db.invoices.findMany({
      where: { school_id: ctx.schoolId, status: "PENDIENTE", due_date: { lt: new Date() }, deleted_at: null },
      include: { student: { select: { first_name: true, last_name: true } } },
      orderBy: { due_date: "asc" },
    }),
  ]);

  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Finanzas</h2><p className="text-sm text-slate-500">{invoices.length} facturas · {overdueInvoices.length} vencidas</p></div>
        <a href="/dashboard/finance/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nueva factura</a>
      </div>
      {overdueInvoices.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-800">Morosidad</h3>
              <p className="text-sm text-red-600">{overdueInvoices.length} facturas vencidas por {totalOverdue.toFixed(0)}€</p>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {overdueInvoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{inv.student.last_name}, {inv.student.first_name} — {inv.concept}</span>
                <span className="text-red-600 font-medium">{Number(inv.amount).toFixed(0)}€ · vence {new Date(inv.due_date).toLocaleDateString("es-ES")}</span>
              </div>
            ))}
            {overdueInvoices.length > 5 && <p className="text-xs text-red-400">+{overdueInvoices.length - 5} más</p>}
          </div>
        </div>
      )}
      <InvoiceList invoices={invoices} paymentProvider={school?.payment_provider ?? "none"} />
    </div>
  );
}
