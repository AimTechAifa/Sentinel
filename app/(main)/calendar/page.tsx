"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, GanttChart } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { SourceBadgeInline } from "@/components/dashboard/UnifiedPortfolioPanel";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { releases as demoReleases } from "@/lib/dummy-data";
import {
  dbReleaseMatchesFilters,
  filterLabel,
} from "@/lib/release-filters";
import {
  dbToUnified,
  demoReleaseMatchesFilters,
  demoToUnified,
  mergeReleases,
  type UnifiedRelease,
} from "@/lib/unified-releases";
import { inPeriod, periodRange, type Period } from "@/lib/period-range";
import { cn, formatDate } from "@/lib/utils";
import { taBtnSecondary } from "@/lib/styles";

type ViewMode = "calendar" | "timeline";
type SourceFilter = "all" | "database" | "demo";

type DbRelease = {
  id: string;
  releaseCode: string;
  name: string;
  status: string;
  releaseDate: string;
  priority: string;
  owner: string;
  departmentId: string;
  department: { name: string };
  applications: { application: { id: string; name: string } }[];
};

const STATUS_COLORS: Record<string, string> = {
  Planned: "bg-blue-100 text-blue-800",
  "In Progress": "bg-brand-100 text-brand-800",
  Blocked: "bg-error-100 text-error-800",
  "At Risk": "bg-amber-100 text-amber-800",
  Complete: "bg-success-100 text-success-800",
  Ready: "bg-brand-100 text-brand-800",
  Scheduled: "bg-blue-100 text-blue-800",
};

export default function CalendarPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [viewDate, setViewDate] = useState(() => new Date());

  const {
    filters,
    hasRefinement,
    departments,
    applications,
    environments,
    bookings,
    dbRows,
  } = useReleaseFilters();

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  const unified = useMemo(() => {
    const filteredDb = (dbRows as DbRelease[])
      .filter((r) => dbReleaseMatchesFilters(r, filters, bookings, environments))
      .map((r) => dbToUnified(r))
      .filter((r) => inPeriod(r.date, period, viewDate));

    const filteredDemo = demoReleases
      .filter((r) => demoReleaseMatchesFilters(r, filters, departments, applications, environments))
      .filter((r) => inPeriod(r.targetDate, period, viewDate))
      .map(demoToUnified);

    let merged = mergeReleases(filteredDb, filteredDemo);
    if (sourceFilter === "database") merged = merged.filter((r) => r.source === "database");
    if (sourceFilter === "demo") merged = merged.filter((r) => r.source === "demo");
    return merged;
  }, [dbRows, period, viewDate, sourceFilter, filters, bookings, environments, departments, applications]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = viewDate.toLocaleString("en-AU", { month: "long", year: "numeric" });
  const { start: periodStart, end: periodEnd } = periodRange(period, viewDate);

  const releasesByDay = useMemo(() => {
    const map: Record<number, UnifiedRelease[]> = {};
    unified.forEach((r) => {
      const d = new Date(r.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(r);
      }
    });
    return map;
  }, [unified, month, year]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const today = new Date();
  const timelineSorted = useMemo(
    () => [...unified].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [unified]
  );
  const timelineSpan = Math.max(periodEnd.getTime() - periodStart.getTime(), 1);

  return (
    <div className="space-y-6">
      <TopBar
        title="Release Calendar"
        subtitle={hasRefinement ? `Filtered · ${scopeLabel}` : "Database and demo releases in one calendar"}
        highlight
      />

      <ReleaseFiltersBar />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1">
          {(["month", "quarter", "year"] as Period[]).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors", period === p ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50")}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1">
          {(["all", "database", "demo"] as SourceFilter[]).map((s) => (
            <button key={s} type="button" onClick={() => setSourceFilter(s)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors", sourceFilter === s ? "bg-violet-500 text-white" : "text-gray-600 hover:bg-gray-50")}>
              {s === "all" ? "All sources" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1">
          <button type="button" onClick={() => setViewMode("calendar")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5", viewMode === "calendar" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50")}>
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </button>
          <button type="button" onClick={() => setViewMode("timeline")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5", viewMode === "timeline" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50")}>
            <GanttChart className="h-3.5 w-3.5" /> Timeline
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Showing {unified.length} release(s) · {formatDate(periodStart.toISOString())} – {formatDate(periodEnd.toISOString())}
      </p>

      {viewMode === "calendar" ? (
        <AdvancedCard variant="glass" noPadding innerClassName="p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className={taBtnSecondary + " !p-2"}><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-brand-500" />{monthName}</h2>
            <button type="button" onClick={nextMonth} className={taBtnSecondary + " !p-2"}><ChevronRight className="w-5 h-5 text-gray-600" /></button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayReleases = releasesByDay[day] ?? [];
              const cellDate = new Date(year, month, day);
              const isToday = cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear();
              return (
                <div key={day} className={cn("min-h-[96px] border p-2 rounded-xl bg-white/80 border-gray-100", isToday && "ring-2 ring-brand-500/40")}>
                  <span className={cn("text-xs font-medium", isToday ? "text-brand-600" : "text-gray-500")}>{day}</span>
                  <div className="space-y-1 mt-1">
                    {dayReleases.map((r) => (
                      <ProgressLink key={`${r.source}-${r.id}`} href={r.href} className="block text-xs truncate hover:bg-brand-50 rounded px-1 py-0.5 -mx-1">
                        <span className={cn("text-[10px] px-1 rounded", STATUS_COLORS[r.status] ?? "bg-gray-100")}>{r.code}</span>
                        <span className="ml-1 text-gray-600">{r.source === "demo" ? "· demo" : ""}</span>
                      </ProgressLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </AdvancedCard>
      ) : (
        <AdvancedCard title="Timeline view" subtitle="Database + demo releases" icon={GanttChart} variant="glass">
          <div className="space-y-3">
            {timelineSorted.length === 0 && <p className="text-sm text-gray-500">No releases in this period.</p>}
            {timelineSorted.map((r) => {
              const offset = ((new Date(r.date).getTime() - periodStart.getTime()) / timelineSpan) * 100;
              return (
                <div key={`${r.source}-${r.id}`}>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-1 flex-wrap">
                    <span className="w-24 shrink-0">{formatDate(r.date)}</span>
                    <SourceBadgeInline source={r.source} />
                    <ProgressLink href={r.href} className="font-medium text-gray-800 hover:text-brand-600">{r.code} · {r.name}</ProgressLink>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px]", STATUS_COLORS[r.status] ?? "bg-gray-100")}>{r.status}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500/80" style={{ width: "8%", marginLeft: `${Math.min(Math.max(offset, 0), 92)}%` }} />
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
