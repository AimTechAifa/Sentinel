"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, GanttChart } from "lucide-react";
import { MonthGridCalendar } from "@/components/calendar/MonthGridCalendar";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { releases as demoReleases } from "@/lib/dummy-data";
import { dbReleaseMatchesFilters, filterLabel } from "@/lib/release-filters";
import {
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
import { cn, formatDate } from "@/lib/utils";
import { taBtnSecondary } from "@/lib/styles";

type ViewMode = "calendar" | "timeline";
type TabMode = "releases" | "environments";

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
  const [viewDate, setViewDate] = useState(() => {
    // For demo matching the screenshot, force it to Dec 2023 if desired, 
    // but default to current date is better.
    return new Date();
  });
  const [tab, setTab] = useState<TabMode>("releases");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const {
    filters,
    hasRefinement,
    departments,
    applications,
    environments,
    bookings,
    dbRows,
  } = useReleaseFilters();

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

    return mergeReleases(filteredDb, filteredDemo);
  }, [dbRows, period, viewDate, filters, bookings, environments, departments, applications]);

  const title = useMemo(() => periodTitle(period, viewDate), [period, viewDate]);

  const prevPeriod = () => setViewDate((d) => shiftPeriodAnchor(period, d, -1));
  const nextPeriod = () => setViewDate((d) => shiftPeriodAnchor(period, d, 1));
  
  // Format title like "December 2023"
  const formattedMonth = useMemo(() => {
    return viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [viewDate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching screenshot */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-theme-sm overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
            
            {/* Center Navigation */}
            <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
              <button type="button" onClick={prevPeriod} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-gray-800 min-w-[120px] text-center">
                {formattedMonth}
              </span>
              <button type="button" onClick={nextPeriod} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Right Toggle */}
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button
                className={cn("px-3 py-1 text-xs font-medium rounded-md", viewMode === "month" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500")}
                onClick={() => setViewMode("month")}
              >
                Month
              </button>
              <button
                className={cn("px-3 py-1 text-xs font-medium rounded-md", viewMode === "week" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500")}
                onClick={() => setViewMode("week")}
              >
                Week
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-gray-100">
            <button
              onClick={() => setTab("releases")}
              className={cn(
                "pb-3 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors",
                tab === "releases" ? "border-brand-500 text-brand-600" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Release Calendar
            </button>
            <button
              onClick={() => setTab("environments")}
              className={cn(
                "pb-3 text-xs font-bold tracking-wide uppercase border-b-2 transition-colors",
                tab === "environments" ? "border-brand-500 text-brand-600" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Environment Bookings
            </button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="p-6 pt-0 bg-gray-50/30">
          <MonthGridCalendar releases={unified} viewDate={viewDate} />
        </div>
      </div>
    </div>
  );
}
