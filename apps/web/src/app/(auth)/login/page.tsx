"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@insti/ui";
import { Button } from "@insti/ui";
import { Input } from "@insti/ui";
import { Label } from "@insti/ui";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Credenciales inválidas");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#1E3A5F] text-white text-xl font-bold">
          I
        </div>
        <CardTitle>Insti ERP</CardTitle>
        <CardDescription>Ingresa con tus credenciales</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@colegio.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-[#2563EB] hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
      </CardContent>
      {process.env.NODE_ENV !== "production" && (
        <CardFooter className="text-center text-xs text-slate-400">
          Demo: admin@insti.dev / admin123
        </CardFooter>
      )}
    </Card>
  );
}
