"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Snowflake, AlertTriangle } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { freezeWindows, releases, services } from "@/lib/dummy-data";
import { cn, formatDate, getDayConflicts, isFriday, isInFreezeWindow } from "@/lib/utils";

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleString("en-AU", { month: "long", year: "numeric" });

  const releasesByDay = useMemo(() => {
    const map: Record<number, typeof releases> = {};
    releases.forEach((r) => {
      const d = new Date(r.targetDate);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(r);
      }
    });
    return map;
  }, [month, year]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
  for (let day = 1; day <= daysInMonth; day++) {
    const dayReleases = releasesByDay[day] ?? [];
    const cellDate = new Date(year, month, day);
    const frozen = isInFreezeWindow(cellDate, freezeWindows);
    const fridayRisk = isFriday(cellDate) && dayReleases.length > 0;
    const conflicts = getDayConflicts(dayReleases, services);
    const isToday =
      cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear();

    cells.push(
      <div
        key={day}
        className={cn(
          "min-h-[96px] border p-2 rounded-lg",
          frozen ? "bg-slate-100 border-slate-200" : "bg-white border-slate-100",
          isToday && "ring-2 ring-brand-500/30"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-xs font-medium", isToday ? "text-brand-600" : "text-gray-500")}>{day}</span>
          <div className="flex gap-1">
            {frozen && (
              <span title="Freeze window">
                <Snowflake className="w-3 h-3 text-slate-400" />
              </span>
            )}
            {fridayRisk && !frozen && <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">Fri</span>}
            {conflicts.length > 0 && (
              <span title={conflicts.join(", ")}>
                <AlertTriangle className="w-3 h-3 text-orange-500" />
              </span>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {dayReleases.map((r) => (
            <ProgressLink
              key={r.id}
              href={`/releases/${r.id}`}
              className="block text-xs truncate hover:bg-brand-50 rounded px-1 py-0.5 -mx-1"
            >
              <StatusBadge status={r.status} className="text-[10px] px-1.5 py-0" />
              <span className="ml-1 text-gray-600">{r.version}</span>
            </ProgressLink>
          ))}
        </div>
        {conflicts.length > 0 && dayReleases.length >= 2 && (
          <p className="text-[10px] text-orange-600 mt-1 leading-tight">{conflicts[0]}</p>
        )}
      </div>
    );
  }

  const monthFreeze = freezeWindows.filter((w) => {
    const start = new Date(w.start);
    const end = new Date(w.end);
    return start.getMonth() <= month && end.getMonth() >= month && start.getFullYear() <= year && end.getFullYear() >= year;
  });

  return (
    <div>
      <TopBar title="Release Calendar" subtitle="Deploy windows, freeze periods, and conflicts" />

      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-800">{monthName}</h2>
        <button type="button" onClick={nextMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {monthFreeze.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {monthFreeze.map((w) => (
            <span key={w.id} className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
              <Snowflake className="w-3 h-3" /> {w.name}: {formatDate(w.start)} – {formatDate(w.end)}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
        ))}
        {cells}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Snowflake className="w-3 h-3" /> Freeze window</span>
        <span className="flex items-center gap-1"><span className="text-amber-600 bg-amber-50 px-1 rounded">Fri</span> Elevated rollback risk</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> Schedule conflict</span>
      </div>
    </div>
  );
}
