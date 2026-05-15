import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Configuración</h2>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Configuración del colegio, año lectivo, roles y permisos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
