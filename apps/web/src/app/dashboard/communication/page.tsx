import { Card, CardHeader, CardTitle, CardContent } from "@insti/ui";

export default function CommunicationPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Comunicación</h2>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Anuncios, mensajería interna y notificaciones para toda la comunidad educativa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
