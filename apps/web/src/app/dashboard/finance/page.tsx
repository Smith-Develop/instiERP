import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { InvoiceList } from "@/modules/invoices/invoice-list";

export default async function FinancePage() {
  const ctx = await getSessionContext();
  const invoices = await db.invoices.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    include: { student: { select: { first_name: true, last_name: true } }, payments: true },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Finanzas</h2><p className="text-sm text-slate-500">{invoices.length} facturas</p></div>
        <a href="/dashboard/finance/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nueva factura</a>
      </div>
      <InvoiceList invoices={invoices} />
    </div>
  );
}
