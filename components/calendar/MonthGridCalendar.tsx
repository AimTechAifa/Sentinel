"use client";

import { useMemo } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import type { UnifiedRelease } from "@/lib/unified-releases";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Planned: "bg-blue-500",
  Scheduled: "bg-blue-500",
  "In Progress": "bg-brand-500",
  Ready: "bg-brand-500",
  Blocked: "bg-error-500",
  "At Risk": "bg-amber-500",
  Complete: "bg-success-500",
  Shipped: "bg-success-500",
};

export function MonthGridCalendar({
  releases,
  viewDate,
}: {
  releases: UnifiedRelease[];
  viewDate: Date;
}) {
  const { gridDays } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const totalCells = firstDay + daysInMonth;
    const paddingAfter = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    const blankBefore = Array.from({ length: firstDay }, (_, i) => {
      const d = new Date(year, month - 1, prevMonthDays - firstDay + i + 1);
      // Format as local YYYY-MM-DD
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().split("T")[0];
      return { date: d, isCurrentMonth: false, dayStr: localISOTime };
    });
    
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().split("T")[0];
      return { date: d, isCurrentMonth: true, dayStr: localISOTime };
    });
    
    const blankAfter = Array.from({ length: paddingAfter }, (_, i) => {
      const d = new Date(year, month + 1, i + 1);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().split("T")[0];
      return { date: d, isCurrentMonth: false, dayStr: localISOTime };
    });
    
    return {
      gridDays: [...blankBefore, ...monthDays, ...blankAfter],
    };
  }, [viewDate]);

  // Group releases by date string (YYYY-MM-DD)
  const releasesByDate = useMemo(() => {
    const map = new Map<string, UnifiedRelease[]>();
    releases.forEach((r) => {
      const d = new Date(r.date);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().split("T")[0];
      if (!map.has(localISOTime)) map.set(localISOTime, []);
      map.get(localISOTime)!.push(r);
    });
    return map;
  }, [releases]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split("T")[0];
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-theme-sm overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div key={day} className="px-2 py-3 text-center text-[10px] font-bold text-gray-500 tracking-wider border-r border-gray-100 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-200">
        {gridDays.map((cell, idx) => {
          const dayEvents = releasesByDate.get(cell.dayStr) || [];
          
          // MOCK: Freeze banner for Dec 20-31, 2023 for visual demonstration
          const isFreezeDay = cell.date.getFullYear() === 2023 && cell.date.getMonth() === 11 && cell.date.getDate() >= 20;
          const isFreezeStart = isFreezeDay && (cell.date.getDate() === 20 || cell.date.getDay() === 0);

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[140px] bg-white p-2 flex flex-col transition-colors hover:bg-gray-50/50 relative",
                !cell.isCurrentMonth && "bg-gray-50/30"
              )}
            >
              {isFreezeDay && (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#fee2e2,#fee2e2_10px,#fef2f2_10px,#fef2f2_20px)] opacity-50 pointer-events-none" />
              )}
              
              <div className="flex justify-start relative z-10">
                <span className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  cell.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                  cell.dayStr === todayStr && "bg-brand-500 text-white"
                )}>
                  {cell.date.getDate()}
                </span>
              </div>
              
              <div className="mt-1 space-y-1 relative z-10 flex-1">
                {dayEvents.map((r) => {
                  const colorClass = STATUS_COLORS[r.status] || "bg-gray-400";
                  return (
                    <ProgressLink
                      key={`${r.source}-${r.id}`}
                      href={r.href}
                      title={`${r.code} - ${r.name}`}
                      className={cn(
                        "block px-1.5 py-1 rounded bg-gray-50/80 border border-gray-100 text-[10px] font-medium text-gray-700 truncate hover:border-gray-300 hover:bg-white transition-colors",
                        !cell.isCurrentMonth && "opacity-70"
                      )}
                    >
                      <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", colorClass)} />
                      {r.code.replace(/^REL-|^v/i, "")}
                    </ProgressLink>
                  );
                })}
              </div>

              {/* Freeze Label (Mock) */}
              {isFreezeStart && isFreezeDay && (
                <div className="relative z-10 mt-1 mb-0.5">
                  <span className="bg-error-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide shadow-sm truncate block max-w-full">
                    YEAR-END FREEZE 21 DAYS
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
