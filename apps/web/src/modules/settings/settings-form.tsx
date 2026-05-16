"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import { Building2, CreditCard } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type SchoolData = {
  id: string; name: string; slug: string; address: string | null; phone: string | null; email: string | null;
  currency: string; country: string; payment_provider: string;
  stripe_public: string | null; stripe_secret: string | null; mp_access_token: string | null;
};
type AcademicYear = { id: string; year_label: string; start_date: Date; end_date: Date; is_active: boolean };

const schema = z.object({
  name: z.string().min(1), address: z.string().optional(), phone: z.string().optional(), email: z.string().optional(),
  currency: z.string().optional(), country: z.string().optional(), payment_provider: z.string().optional(),
  stripe_public: z.string().optional(), stripe_secret: z.string().optional(), mp_access_token: z.string().optional(),
});

const currencies = [{ value: "eur", label: "EUR (€)" }, { value: "usd", label: "USD ($)" }, { value: "mxn", label: "MXN" }, { value: "ars", label: "ARS" }, { value: "brl", label: "BRL" }, { value: "cop", label: "COP" }, { value: "clp", label: "CLP" }, { value: "pen", label: "PEN" }];
const countries = [{ value: "ES", label: "España" }, { value: "MX", label: "México" }, { value: "AR", label: "Argentina" }, { value: "BR", label: "Brasil" }, { value: "CO", label: "Colombia" }, { value: "CL", label: "Chile" }, { value: "PE", label: "Perú" }];
const providers = [{ value: "none", label: "Ninguno" }, { value: "stripe", label: "Stripe" }, { value: "mercadopago", label: "MercadoPago" }];

export function SettingsForm({ school, academicYears }: { school: SchoolData | null; academicYears: AcademicYear[] }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(school?.payment_provider ?? "none");

  const { register, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: {
    name: school?.name ?? "", address: school?.address ?? "", phone: school?.phone ?? "", email: school?.email ?? "",
    currency: school?.currency ?? "eur", country: school?.country ?? "ES", payment_provider: school?.payment_provider ?? "none",
    stripe_public: school?.stripe_public ?? "", stripe_secret: school?.stripe_secret ?? "", mp_access_token: school?.mp_access_token ?? "",
  }});

  async function onSubmit(data: Record<string, unknown>) {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/schools", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Error al guardar");
      setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]/10"><Building2 className="h-5 w-5 text-[#1E3A5F]"/></div><div><CardTitle>Perfil del colegio</CardTitle></div></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Nombre</Label><Input {...register("name")} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input defaultValue={school?.slug ?? ""} disabled /></div>
            </div>
            <div className="space-y-2"><Label>Dirección</Label><Input {...register("address")} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Teléfono</Label><Input {...register("phone")} /></div>
              <div className="space-y-2"><Label>Email</Label><Input {...register("email")} /></div>
            </div>
            {saved && <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Cambios guardados</div>}
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </CardContent>
          <CardFooter className="border-t pt-6"><Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button></CardFooter>
        </form>
      </Card>

      {/* Payment Configuration */}
      <Card>
        <CardHeader><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]/10"><CreditCard className="h-5 w-5 text-[#1E3A5F]"/></div><div><CardTitle>Configuración de Pagos</CardTitle></div></div></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Moneda</Label><select {...register("currency")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">{currencies.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
            <div className="space-y-2"><Label>País</Label><select {...register("country")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">{countries.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          </div>
          <div className="space-y-2"><Label>Proveedor de pagos</Label><select {...register("payment_provider")} onChange={e => { setProvider(e.target.value); }} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-700">{providers.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
          {provider === "stripe" && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2"><Label>Stripe Secret Key</Label><Input type="password" {...register("stripe_secret")} placeholder="sk_live_..."/></div>
              <div className="space-y-2"><Label>Stripe Public Key</Label><Input {...register("stripe_public")} placeholder="pk_live_..."/></div>
            </div>
          )}
          {provider === "mercadopago" && (
            <div className="space-y-2 pt-2"><Label>MercadoPago Access Token</Label><Input type="password" {...register("mp_access_token")} placeholder="APP_USR-..."/></div>
          )}
          <p className="text-xs text-slate-400">Webhook: configura en el dashboard de {provider === "stripe" ? "Stripe" : "MercadoPago"} la URL de notificaciones.</p>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle>Años lectivos</CardTitle></CardHeader><CardContent><div className="space-y-2">{academicYears.map(y=><div key={y.id} className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"><div><p className="font-medium text-slate-900">{y.year_label}</p><p className="text-sm text-slate-500">{new Date(y.start_date).toLocaleDateString("es-ES")} — {new Date(y.end_date).toLocaleDateString("es-ES")}</p></div><span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${y.is_active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{y.is_active?"Activo":"Inactivo"}</span></div>)}</div></CardContent></Card>
    </div>
  );
}
