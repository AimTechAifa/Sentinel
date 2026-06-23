"use client";

import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { EnterpriseDepartment, ReleaseImpact, ReleaseSize, ReleaseTimelineEntry } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const DEPARTMENTS: EnterpriseDepartment[] = ["FIN", "HR", "Security", "Platform", "CRM", "Operations"];
const SIZES: ReleaseSize[] = ["high", "medium", "low"];
const IMPACTS: ReleaseImpact[] = ["high", "medium", "low"];

const sizeColors: Record<ReleaseSize, string> = {
  high: "bg-error-500",
  medium: "bg-warning-500",
  low: "bg-success-500",
};

const impactStyles: Record<ReleaseImpact, string> = {
  high: "border-error-300 bg-error-50/80",
  medium: "border-warning-300 bg-warning-50/80",
  low: "border-success-300 bg-success-50/80",
};

export function ReleaseTimeline({ entries }: { entries: ReleaseTimelineEntry[] }) {
  const [deptFilter, setDeptFilter] = useState<EnterpriseDepartment | "all">("all");
  const [sizeFilter, setSizeFilter] = useState<ReleaseSize | "all">("all");
  const [impactFilter, setImpactFilter] = useState<ReleaseImpact | "all">("all");

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (deptFilter === "all" || e.department === deptFilter) &&
          (sizeFilter === "all" || e.size === sizeFilter) &&
          (impactFilter === "all" || e.impact === impactFilter)
      ),
    [entries, deptFilter, sizeFilter, impactFilter]
  );

  const { minDate, rangeMs } = useMemo(() => {
    const dates = filtered.flatMap((e) => [new Date(e.startDate), new Date(e.endDate)]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 3);
    return { minDate: min, rangeMs: max.getTime() - min.getTime() || 1 };
  }, [filtered]);

  const ticks = useMemo(() => {
    const count = 8;
    return Array.from({ length: count + 1 }, (_, i) => {
      const t = minDate.getTime() + (rangeMs * i) / count;
      return new Date(t);
    });
  }, [minDate, rangeMs]);

  const pos = (date: string) => {
    const pct = ((new Date(date).getTime() - minDate.getTime()) / rangeMs) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <AdvancedCard
      title="Release Timeline"
      subtitle="Portfolio release calendar — filter by department, size, and impact"
      icon={CalendarRange}
      variant="glass"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterPills label="Dept" value={deptFilter} options={["all", ...DEPARTMENTS]} onChange={setDeptFilter} />
        <FilterPills label="Size" value={sizeFilter} options={["all", ...SIZES]} onChange={setSizeFilter} />
        <FilterPills label="Impact" value={impactFilter} options={["all", ...IMPACTS]} onChange={setImpactFilter} />
      </div>

      <div className="relative pt-2 pb-8">
        <div className="absolute left-0 right-0 top-[52px] h-0.5 bg-gray-200 rounded-full" />
        <div className="flex justify-between text-[10px] text-gray-400 mb-1 px-0.5">
          {ticks.map((t, i) => (
            <span key={i} className="tabular-nums">
              {t.toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
            </span>
          ))}
        </div>

        <div className="space-y-2 min-h-[120px]">
          {filtered.map((entry, row) => (
            <div key={entry.id} className="relative h-9">
              <div
                className={cn(
                  "absolute top-1 h-7 rounded-lg border flex items-center px-2 gap-2 text-xs font-medium shadow-sm transition-all hover:shadow-md cursor-default",
                  impactStyles[entry.impact]
                )}
                style={{
                  left: `${pos(entry.startDate)}%`,
                  width: `${Math.max(4, pos(entry.endDate) - pos(entry.startDate))}%`,
                  marginTop: row % 2 === 1 ? 4 : 0,
                }}
                title={`${entry.name} · ${formatDate(entry.startDate)} → ${formatDate(entry.endDate)}`}
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", sizeColors[entry.size])} />
                <span className="truncate">{entry.name}</span>
                <span className="text-[10px] opacity-60 shrink-0">{entry.department}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No releases match the current filters.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-error-500" /> High size
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning-500" /> Medium size
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success-500" /> Low size
        </span>
      </div>
    </AdvancedCard>
  );
}

function FilterPills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mr-1">{label}</span>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-lg px-2 py-0.5 text-xs capitalize transition-colors",
            value === opt ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
