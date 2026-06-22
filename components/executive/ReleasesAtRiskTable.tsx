"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { StatusBadge } from "@/components/badges/StatusBadge";
import type { ReleasePrediction } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { getRiskTextColor } from "@/lib/predictive";
import { AlertTriangle } from "lucide-react";

export function ReleasesAtRiskTable({ predictions }: { predictions: ReleasePrediction[] }) {
  const atRisk = predictions.filter((p) => p.shipSuccessPct < 65 || p.rollbackRiskPct >= 20).slice(0, 8);

  return (
    <div className="ta-table-wrap">
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
        <AlertTriangle className="h-5 w-5 text-warning-500" />
        <h3 className="font-semibold text-gray-800">Releases at Risk — ML Forecast</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-theme-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-3 text-left font-medium">Release</th>
              <th className="p-3 text-left font-medium">Team</th>
              <th className="p-3 text-left font-medium">Target</th>
              <th className="p-3 text-left font-medium">Ship success</th>
              <th className="p-3 text-left font-medium">Rollback risk</th>
              <th className="p-3 text-left font-medium">Delay risk</th>
              <th className="p-3 text-left font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {atRisk.map((p) => (
              <tr key={p.releaseId} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <ProgressLink href={`/releases/${p.releaseId}`} className="font-medium text-brand-500 hover:underline">
                    {p.version}
                  </ProgressLink>
                </td>
                <td className="p-3 text-gray-600">{p.team}</td>
                <td className="p-3 text-gray-500">{formatDate(p.targetDate)}</td>
                <td className={cn("p-3 font-medium", getRiskTextColor(100 - p.shipSuccessPct))}>
                  {p.shipSuccessPct}%
                </td>
                <td className={cn("p-3 font-medium", getRiskTextColor(p.rollbackRiskPct))}>
                  {p.rollbackRiskPct}%
                </td>
                <td className="p-3 text-gray-600">{p.delayRiskPct}%</td>
                <td className="p-3">
                  <StatusBadge status={p.confidence >= 85 ? "Approved" : p.confidence >= 70 ? "Pending" : "At Risk"} />
                  <span className="ml-1 text-gray-500">{p.confidence}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
