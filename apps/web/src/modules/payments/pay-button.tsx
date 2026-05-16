"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@insti/ui";
import { Loader2, CreditCard } from "lucide-react";

async function createStripeCheckout(invoiceId: string) {
  const res = await fetch("/api/payments/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId }),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Error"); }
  return res.json();
}

async function createMercadoPagoCheckout(invoiceId: string) {
  const res = await fetch("/api/payments/mercadopago/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId }),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Error"); }
  return res.json();
}

export function PayButton({ invoiceId, provider }: { invoiceId: string; provider: string }) {
  const mutation = useMutation({
    mutationFn: (id: string) =>
      provider === "mercadopago"
        ? createMercadoPagoCheckout(id)
        : createStripeCheckout(id),
    onSuccess: (data) => {
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    },
  });

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => mutation.mutate(invoiceId)}
      disabled={mutation.isPending}
      className="gap-1"
    >
      {mutation.isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CreditCard className="h-3 w-3" />
      )}
      Pagar
    </Button>
  );
}
