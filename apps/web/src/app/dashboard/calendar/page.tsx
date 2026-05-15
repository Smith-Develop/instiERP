import { db } from "@insti/database";
import { getSessionContext } from "@/lib/context";
import { EventList } from "@/modules/events/event-list";

export default async function CalendarPage() {
  const ctx = await getSessionContext();
  const events = await db.events.findMany({
    where: { school_id: ctx.schoolId, deleted_at: null },
    orderBy: { start_date: "asc" },
    take: 50,
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Calendario</h2><p className="text-sm text-slate-500">{events.length} eventos</p></div>
        <a href="/dashboard/calendar/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">+ Nuevo evento</a>
      </div>
      <EventList events={events} />
    </div>
  );
}
