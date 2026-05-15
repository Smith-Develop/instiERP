export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="text-4xl text-slate-300 font-bold">404</div>
      <h2 className="text-lg font-semibold text-slate-900">Página no encontrada</h2>
      <p className="max-w-sm text-sm text-slate-500">La página que buscas no existe o fue movida.</p>
      <a href="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">Volver al panel</a>
    </div>
  );
}
