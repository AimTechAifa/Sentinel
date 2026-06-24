"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, GanttChart } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { inPeriod, periodRange, type Period } from "@/lib/period-range";
import { cn, formatDate } from "@/lib/utils";
import { taBtnSecondary } from "@/lib/styles";

type ViewMode = "calendar" | "timeline";

type DbRelease = {
  id: string;
  releaseCode: string;
  name: string;
  status: string;
  releaseDate: string;
  priority: string;
  department: { name: string };
};

const STATUS_COLORS: Record<string, string> = {
  Planned: "bg-blue-100 text-blue-800",
  "In Progress": "bg-brand-100 text-brand-800",
  Blocked: "bg-error-100 text-error-800",
  "At Risk": "bg-amber-100 text-amber-800",
  Complete: "bg-success-100 text-success-800",
};

export default function CalendarPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [releases, setReleases] = useState<DbRelease[]>([]);

  useEffect(() => {
    fetch("/api/releases").then((r) => r.json()).then(setReleases);
  }, []);

  const filtered = useMemo(
    () => releases.filter((r) => inPeriod(r.releaseDate, period, viewDate)),
    [releases, period, viewDate]
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleString("en-AU", { month: "long", year: "numeric" });
  const { start: periodStart, end: periodEnd } = periodRange(period, viewDate);

  const releasesByDay = useMemo(() => {
    const map: Record<number, DbRelease[]> = {};
    filtered.forEach((r) => {
      const d = new Date(r.releaseDate);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(r);
      }
    });
    return map;
  }, [filtered, month, year]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const today = new Date();

  const timelineSorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()),
    [filtered]
  );

  const timelineSpan = Math.max(periodEnd.getTime() - periodStart.getTime(), 1);

  return (
    <div className="space-y-6">
      <TopBar title="Release Calendar" subtitle="Period filter with calendar and timeline views" highlight />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1">
          {(["month", "quarter", "year"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                period === p ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors",
              viewMode === "calendar" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors",
              viewMode === "timeline" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <GanttChart className="h-3.5 w-3.5" /> Timeline
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Showing {filtered.length} release(s) for {period} · {formatDate(periodStart.toISOString())} – {formatDate(periodEnd.toISOString())}
      </p>

      {viewMode === "calendar" ? (
        <AdvancedCard variant="glass" noPadding innerClassName="p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className={taBtnSecondary + " !p-2"}>
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-brand-500" />
              {monthName}
            </h2>
            <button type="button" onClick={nextMonth} className={taBtnSecondary + " !p-2"}>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayReleases = releasesByDay[day] ?? [];
              const cellDate = new Date(year, month, day);
              const isToday =
                cellDate.getDate() === today.getDate() &&
                cellDate.getMonth() === today.getMonth() &&
                cellDate.getFullYear() === today.getFullYear();

              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-[96px] border p-2 rounded-xl transition-all bg-white/80 border-gray-100 hover:border-brand-100",
                    isToday && "ring-2 ring-brand-500/40"
                  )}
                >
                  <span className={cn("text-xs font-medium", isToday ? "text-brand-600" : "text-gray-500")}>{day}</span>
                  <div className="space-y-1 mt-1">
                    {dayReleases.map((r) => (
                      <ProgressLink
                        key={r.id}
                        href={`/releases/${r.id}`}
                        className="block text-xs truncate hover:bg-brand-50 rounded px-1 py-0.5 -mx-1"
                      >
                        <span className={cn("text-[10px] px-1.5 py-0 rounded", STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-700")}>
                          {r.releaseCode}
                        </span>
                        <span className="ml-1 text-gray-600">{r.name}</span>
                      </ProgressLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </AdvancedCard>
      ) : (
        <AdvancedCard title="Timeline view" subtitle="Releases in selected period" icon={GanttChart} variant="glass">
          <div className="space-y-3">
            {timelineSorted.length === 0 && (
              <p className="text-sm text-gray-500">No releases in this period.</p>
            )}
            {timelineSorted.map((r) => {
              const d = new Date(r.releaseDate);
              const offset = ((d.getTime() - periodStart.getTime()) / timelineSpan) * 100;
              return (
                <div key={r.id} className="relative">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                    <span className="w-24 shrink-0">{formatDate(r.releaseDate)}</span>
                    <ProgressLink href={`/releases/${r.id}`} className="font-medium text-gray-800 hover:text-brand-600">
                      {r.releaseCode} · {r.name}
                    </ProgressLink>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px]", STATUS_COLORS[r.status] ?? "bg-gray-100")}>{r.status}</span>
                    <span className="text-gray-400">{r.department.name}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500/80"
                      style={{ width: "8%", marginLeft: `${Math.min(Math.max(offset, 0), 92)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AdvancedCard>
      )}
    </div>
  );
}
