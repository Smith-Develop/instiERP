import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { AdmissionTable } from "@/modules/admissions/table";
import { NewAdmissionButton } from "@/modules/admissions/new-admission-button";
import { AdmissionFilter } from "@/modules/admissions/admission-filter";

type Props = { searchParams: Promise<{ status?: string }> };

const STATUS_LABELS: Record<string, string> = { PENDIENTE: "Pendiente", EN_TRAMITE: "En trámite", ADMITIDO: "Admitido", NO_ADMITIDO: "No admitido", MATRICULADO: "Matriculado" };

export default async function AdmissionsPage({ searchParams }: Props) {
  const ctx = await getSessionContext();
  const { status } = await searchParams;

  const admissions = await db.admissions.findMany({
    where: {
      school_id: ctx.schoolId,
      deleted_at: null,
      ...(status && status in STATUS_LABELS ? { status } : {}),
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Admisiones</h2><p className="text-sm text-slate-500">{admissions.length} preinscripciones</p></div>
        <div className="flex items-center gap-3">
          <AdmissionFilter current={status} />
          <NewAdmissionButton />
        </div>
      </div>
      <AdmissionTable admissions={admissions} />
    </div>
  );
}
