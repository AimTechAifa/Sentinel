"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, GanttChart } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { ReleaseScheduleGrid } from "@/components/calendar/ReleaseScheduleGrid";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { releases as demoReleases } from "@/lib/dummy-data";
import { dbReleaseMatchesFilters, filterLabel } from "@/lib/release-filters";
import {
  buildScheduleColumns,
  periodTitle,
  shiftPeriodAnchor,
} from "@/lib/calendar-schedule";
import {
  dbToUnified,
  demoReleaseMatchesFilters,
  demoToUnified,
  mergeReleases,
} from "@/lib/unified-releases";
import { inPeriod, periodRange, type Period } from "@/lib/period-range";
import { periodLabel } from "@/lib/period-labels";
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
  impact: string;
  owner: string;
  departmentId: string;
  department: { name: string };
  applications: { application: { id: string; name: string } }[];
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

  const { start: periodStart, end: periodEnd } = useMemo(
    () => periodRange(period, viewDate),
    [period, viewDate]
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

  const columns = useMemo(() => buildScheduleColumns(period, viewDate), [period, viewDate]);
  const title = useMemo(() => periodTitle(period, viewDate), [period, viewDate]);

  const prevPeriod = () => setViewDate((d) => shiftPeriodAnchor(period, d, -1));
  const nextPeriod = () => setViewDate((d) => shiftPeriodAnchor(period, d, 1));
  const goToday = () => setViewDate(new Date());

  return (
    <div className="space-y-6">
      <TopBar
        title="Release Calendar"
        subtitle={hasRefinement ? `Filtered · ${scopeLabel}` : "Releases plotted by date across the selected period"}
        highlight
      />

      <ReleaseFiltersBar variant="large" period={period} onPeriodChange={setPeriod} />

      <AdvancedCard variant="glass" innerClassName="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Viewing options</p>
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors",
                  viewMode === "calendar" ? "bg-brand-500 text-white shadow-theme-sm" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <CalendarDays className="h-4 w-4" /> Calendar
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors",
                  viewMode === "timeline" ? "bg-brand-500 text-white shadow-theme-sm" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <GanttChart className="h-4 w-4" /> Timeline
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
              {(["all", "database", "demo"] as SourceFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSourceFilter(s)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    sourceFilter === s ? "bg-violet-500 text-white" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={prevPeriod} className={cn(taBtnSecondary, "!p-2")} aria-label="Previous period">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-center min-w-[140px]">
              <h2 className="font-semibold text-gray-800">{title}</h2>
              <p className="text-xs text-gray-500">{periodLabel(period)} view</p>
            </div>
            <button type="button" onClick={nextPeriod} className={cn(taBtnSecondary, "!p-2")} aria-label="Next period">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            <button type="button" onClick={goToday} className={cn(taBtnSecondary, "text-xs ml-1")}>
              Today
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {unified.length} release{unified.length === 1 ? "" : "s"} · {formatDate(periodStart.toISOString())} – {formatDate(periodEnd.toISOString())}
          </p>
        </div>
      </AdvancedCard>

      <div>
        <p className="text-xs text-gray-500 mb-2 flex flex-wrap gap-3">
          <span>Dates run horizontally along the top; each release is a row on the vertical axis.</span>
          {viewMode === "calendar" ? (
            <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-brand-500" /> Calendar — marker on release date</span>
          ) : (
            <span className="inline-flex items-center gap-1"><span className="inline-block h-1.5 w-6 rounded-full bg-brand-500" /> Timeline — bar on release date</span>
          )}
        </p>
        <ReleaseScheduleGrid releases={unified} columns={columns} mode={viewMode} />
      </div>
    </div>
  );
}
