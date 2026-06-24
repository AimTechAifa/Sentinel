"use client";

import { useMemo } from "react";
import { Filter } from "lucide-react";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { PERIOD_OPTIONS } from "@/lib/period-labels";
import type { Period } from "@/lib/period-range";
import { cn } from "@/lib/utils";

const selectDefault =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 min-w-[140px]";

const selectLarge =
  "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 min-w-[200px] shadow-theme-sm";

const labelDefault = "text-[10px] font-medium uppercase tracking-wide text-gray-400";
const labelLarge = "text-xs font-semibold uppercase tracking-wide text-gray-500";

export function ReleaseFiltersBar({
  className,
  variant = "default",
  period,
  onPeriodChange,
}: {
  className?: string;
  variant?: "default" | "large";
  period?: Period;
  onPeriodChange?: (period: Period) => void;
}) {
  const {
    filters,
    setDepartmentId,
    setApplicationId,
    setEnvironmentId,
    clearFilters,
    hasRefinement,
    departments,
    applications,
    envOptions,
    loading,
  } = useReleaseFilters();

  const appOptions = useMemo(() => {
    if (!filters.departmentId) return applications;
    return applications.filter((a) => a.departmentId === filters.departmentId);
  }, [applications, filters.departmentId]);

  const large = variant === "large";
  const selectClass = large ? selectLarge : selectDefault;
  const labelClass = large ? labelLarge : labelDefault;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-theme-sm",
        large ? "p-5 md:p-6" : "bg-white/80 p-3",
        className
      )}
    >
      <div className={cn("flex flex-wrap items-end gap-4 md:gap-5", large && "gap-y-4")}>
        <div className={cn("flex items-center gap-2 shrink-0", large ? "text-sm font-semibold text-gray-700" : "text-xs font-medium text-gray-500")}>
          <Filter className={large ? "h-5 w-5 text-brand-500" : "h-3.5 w-3.5"} />
          Filter by
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Department</span>
          <select
            value={filters.departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className={selectClass}
            disabled={loading}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Application</span>
          <select
            value={filters.applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className={selectClass}
            disabled={loading}
          >
            <option value="">All applications</option>
            {appOptions.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Environment</span>
          <select
            value={filters.environmentId}
            onChange={(e) => setEnvironmentId(e.target.value)}
            className={selectClass}
            disabled={loading || !envOptions.length}
          >
            <option value="">All environments</option>
            {envOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.application.name} — {e.name}
              </option>
            ))}
          </select>
        </label>

        {period !== undefined && onPeriodChange && (
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Period</span>
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value as Period)}
              className={selectClass}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        )}

        {hasRefinement && (
          <button
            type="button"
            onClick={clearFilters}
            className={cn(
              "rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors",
              large ? "px-4 py-3 text-sm font-medium" : "px-2.5 py-1.5 text-xs"
            )}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
