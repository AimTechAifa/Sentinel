"use client";

import type { TeamRiskCell } from "@/lib/types";
import { getRiskColor, getRiskTextColor } from "@/lib/predictive";
import { cn } from "@/lib/utils";

export function TeamRiskHeatmap({ data }: { data: TeamRiskCell[] }) {
  return (
    <div className="ta-card p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Team Risk Heatmap</h3>
      <p className="text-xs text-gray-500 mb-4">Composite risk from blockers, readiness, and release status</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map((cell) => (
          <div
            key={cell.team}
            className="rounded-xl border border-gray-100 p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800">{cell.team}</span>
              <span className={cn("text-lg font-bold", getRiskTextColor(cell.riskScore))}>
                {cell.riskScore}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
              <div
                className={cn("h-full rounded-full transition-all", getRiskColor(cell.riskScore))}
                style={{ width: `${cell.riskScore}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
              <span>{cell.active} active</span>
              {cell.atRisk > 0 && <span className="text-warning-600">{cell.atRisk} at risk</span>}
              {cell.blocked > 0 && <span className="text-error-600">{cell.blocked} blocked</span>}
              <span>{cell.avgReadiness}% ready</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
