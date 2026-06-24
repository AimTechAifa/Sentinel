"use client";

import { useMemo } from "react";
import { Filter } from "lucide-react";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { cn } from "@/lib/utils";

const selectClass =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 min-w-[140px]";

export function ReleaseFiltersBar({ className }: { className?: string }) {
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

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white/80 p-3",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 shrink-0">
        <Filter className="h-3.5 w-3.5" />
        Filter by
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Department</span>
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
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Application</span>
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
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Environment</span>
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
      {hasRefinement && (
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
