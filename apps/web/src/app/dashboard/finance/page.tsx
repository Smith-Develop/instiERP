import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Finanzas</h2>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Mensualidades, facturación, pagos online y control de morosidad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
