"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { Filter } from "lucide-react";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { PERIOD_OPTIONS } from "@/lib/period-labels";
import type { Period } from "@/lib/period-range";
import { cn } from "@/lib/utils";

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

  const appOptions = filters.departmentId
    ? applications.filter((a) => a.departmentId === filters.departmentId)
    : applications;

  const fields = (
    <div className="flex flex-wrap items-center gap-3">
      <select
        disabled={loading}
        value={filters.departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        className="h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
      >
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      <select
        disabled={loading}
        value={filters.applicationId}
        onChange={(e) => setApplicationId(e.target.value)}
        className="h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
      >
        <option value="">All applications</option>
        {appOptions.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      <select
        disabled={loading || !envOptions.length}
        value={filters.environmentId}
        onChange={(e) => setEnvironmentId(e.target.value)}
        className="h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
      >
        <option value="">All environments</option>
        {envOptions.map((e) => (
          <option key={e.id} value={e.id}>
            {e.application.name} — {e.name}
          </option>
        ))}
      </select>

      {period !== undefined && onPeriodChange && (
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as Period)}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {hasRefinement && (
        <button 
          type="button" 
          onClick={clearFilters} 
          className="h-9 px-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-4 mb-6", className)}>
      <div className="flex items-center gap-2 text-gray-500">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Filter By</span>
      </div>
      {fields}
    </div>
  );
}
