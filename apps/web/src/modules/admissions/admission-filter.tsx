"use client";

import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_TRAMITE: "En trámite",
  ADMITIDO: "Admitido",
  NO_ADMITIDO: "No admitido",
  MATRICULADO: "Matriculado",
};

export function AdmissionFilter({ current }: { current?: string }) {
  const router = useRouter();

  function handleChange(status: string) {
    if (status) {
      router.push(`?status=${status}`);
    } else {
      router.push("?");
    }
  }

  return (
    <select
      value={current ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700"
    >
      <option value="">Todos los estados</option>
      {Object.entries(STATUS_LABELS).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}
