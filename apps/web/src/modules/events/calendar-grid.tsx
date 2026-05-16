"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@insti/ui";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  target: string;
  description: string | null;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getMonthRange(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {
    from: first.toISOString().split("T")[0]!,
    to: last.toISOString().split("T")[0]!,
    firstDayOfWeek: first.getDay() === 0 ? 6 : first.getDay() - 1, // Mon=0, Sun=6
    daysInMonth: last.getDate(),
  };
}

async function fetchEvents(from: string, to: string) {
  const res = await fetch(`/api/events?from=${from}&to=${to}`);
  if (!res.ok) throw new Error("Error");
  const data = await res.json();
  return data.data.items as Event[];
}

export function CalendarGrid() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { from, to, firstDayOfWeek, daysInMonth } = useMemo(() => getMonthRange(year, month), [year, month]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", from, to],
    queryFn: () => fetchEvents(from, to),
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<number, Event[]>();
    for (const ev of events) {
      const start = new Date(ev.start_date);
      const end = new Date(ev.end_date);
      const dayStart = new Date(year, month, 1);
      const dayEnd = new Date(year, month + 1, 0);

      let d = new Date(Math.max(start.getTime(), dayStart.getTime()));
      const last = new Date(Math.min(end.getTime(), dayEnd.getTime()));

      while (d <= last) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(ev);
        d.setDate(d.getDate() + 1);
      }
    }
    return map;
  }, [events, year, month]);

  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];

  // Previous month fill
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push(daysInPrevMonth - i);
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(i);
  }
  // Next month fill
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) cells.push(i);
  }

  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>
            <ChevronLeft className="h-4 w-4"/>
          </Button>
          <h2 className="text-xl font-bold text-slate-900 min-w-[180px] text-center">{MONTHS[month]} {year}</h2>
          <Button variant="outline" size="icon" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>
            <ChevronRight className="h-4 w-4"/>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}>Hoy</Button>
        </div>
        <Link href="/dashboard/calendar/new" className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5A8A]">
          <Plus className="h-4 w-4"/> Nuevo evento
        </Link>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px rounded-lg border border-slate-200 bg-slate-100 overflow-hidden">
        {WEEKDAYS.map(w => (
          <div key={w} className="bg-slate-50 px-2 py-2 text-center text-xs font-medium uppercase text-slate-500">{w}</div>
        ))}

        {/* Day cells */}
        {cells.map((day, idx) => {
          const isCurrentMonth = idx >= firstDayOfWeek && idx < firstDayOfWeek + daysInMonth;
          const dayEvents = day && isCurrentMonth ? (eventsByDay.get(day) ?? []) : [];
          const todayClass = day && isToday(day) && isCurrentMonth ? "ring-2 ring-[#2563EB] ring-inset" : "";

          return (
            <button
              key={idx}
              onClick={() => day && isCurrentMonth && setSelectedDay(day)}
              className={`relative bg-white min-h-[80px] p-1.5 text-left transition-colors hover:bg-slate-50 ${
                !isCurrentMonth ? "bg-slate-50/50 text-slate-300" : "text-slate-900"
              } ${selectedDay === day ? "bg-blue-50/50" : ""} ${todayClass}`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
                day && isToday(day) && isCurrentMonth ? "bg-[#2563EB] text-white" : ""
              }`}>
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                      ev.target === "ESTUDIANTES" ? "bg-purple-100 text-purple-700"
                      : ev.target === "PROFESORES" ? "bg-amber-100 text-amber-700"
                      : ev.target === "PADRES" ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 3} más</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Eventos del {selectedDay} de {MONTHS[month]} {year}
          </h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin"/> Cargando...</div>
          ) : selectedDayEvents.length === 0 ? (
            <p className="text-sm text-slate-400">Sin eventos este día.</p>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 rounded-md border border-slate-100 px-4 py-3">
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-xs text-slate-400">{new Date(ev.start_date).toLocaleDateString("es-ES", { month: "short" })}</p>
                    <p className="text-lg font-bold text-slate-900">{new Date(ev.start_date).getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{ev.title}</p>
                    {ev.description && <p className="text-sm text-slate-500 mt-0.5">{ev.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">
                        {new Date(ev.start_date).toLocaleDateString("es-ES", { dateStyle: "long" })}
                        {ev.start_date !== ev.end_date && ` — ${new Date(ev.end_date).toLocaleDateString("es-ES", { dateStyle: "long" })}`}
                      </span>
                      <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{ev.target}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
