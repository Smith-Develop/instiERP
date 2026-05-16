"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@insti/ui";
import { Button, Input, Label } from "@insti/ui";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Error"); }
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#1E3A5F] text-white text-xl font-bold">I</div>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>Te enviaremos un enlace para restablecerla</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Si el email existe en nuestro sistema, recibirás un enlace de recuperación.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required/></div>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar enlace"}</Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-center text-sm">
        <Link href="/login" className="text-[#2563EB] hover:underline">Volver al inicio de sesión</Link>
      </CardFooter>
    </Card>
  );
}
