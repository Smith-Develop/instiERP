export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#1E3A5F]" />
        <span className="text-sm">Cargando...</span>
      </div>
    </div>
  );
}
