"use client";
import { formatCurrency } from "@insti/utils";
import { PayButton } from "@/modules/payments/pay-button";

type Invoice = { id: string; student: { first_name: string; last_name: string }; concept: string; amount: { toString: () => string }; status: string; due_date: Date; payments: { amount: { toString: () => string } }[] };

export function InvoiceList({ invoices, paymentProvider }: { invoices: Invoice[]; paymentProvider: string }) {
  const totalPending = invoices.filter(i => i.status === "PENDIENTE").reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === "PAGADO").reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500 uppercase">Facturas</p><p className="mt-1 text-2xl font-bold text-slate-900">{invoices.length}</p></div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4"><p className="text-xs text-red-600 uppercase">Pendiente</p><p className="mt-1 text-2xl font-bold text-red-700">{formatCurrency(totalPending)}</p></div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs text-emerald-600 uppercase">Pagado</p><p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p></div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full"><thead><tr className="border-b bg-slate-50">
          {["Estudiante","Concepto","Importe","Vencimiento","Estado", paymentProvider !== "none" ? "Pagar" : ""].filter(Boolean).map(h=><th key={h} className="h-12 px-4 text-left text-xs font-medium uppercase text-slate-500">{h}</th>)}
        </tr></thead>
        <tbody>
          {invoices.length===0 ? <tr><td colSpan={paymentProvider !== "none" ? 6 : 5} className="p-8 text-center text-sm text-slate-400">No hay facturas</td></tr> :
            invoices.map(inv => (
              <tr key={inv.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900 text-sm">{inv.student.last_name}, {inv.student.first_name}</td>
                <td className="p-4 text-sm text-slate-500">{inv.concept}</td>
                <td className="p-4 text-sm">{formatCurrency(Number(inv.amount))}</td>
                <td className="p-4 text-sm text-slate-500">{new Date(inv.due_date).toLocaleDateString("es-ES")}</td>
                <td className="p-4"><span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${inv.status==="PAGADO"?"bg-emerald-50 text-emerald-700":inv.status==="PENDIENTE"?"bg-amber-50 text-amber-700":"bg-red-50 text-red-700"}`}>{inv.status}</span></td>
                {paymentProvider !== "none" && <td className="p-4">{inv.status === "PENDIENTE" ? <PayButton invoiceId={inv.id} provider={paymentProvider} /> : null}</td>}
              </tr>))
          }
        </tbody></table>
      </div>
    </div>
  );
}
