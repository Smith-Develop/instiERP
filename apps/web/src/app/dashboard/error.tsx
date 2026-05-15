"use client";

import { Button } from "@insti/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="rounded-full bg-red-50 p-4">
        <div className="h-8 w-8 rounded-full border-2 border-red-300 flex items-center justify-center text-red-500 font-bold">!</div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Algo salió mal</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{error.message || "Error inesperado"}</p>
      </div>
      <Button variant="outline" onClick={reset}>Reintentar</Button>
    </div>
  );
}
