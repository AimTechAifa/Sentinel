"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ReleaseDecisionBadge } from "@/components/releases/ReleaseDecisionBadge";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { releases } from "@/lib/dummy-data";
import { calcReadiness, formatDate } from "@/lib/utils";
import { Flag, Package } from "lucide-react";

export default function ReleasesPage() {
  const sorted = [...releases].sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());
  return (
    <div>
      <TopBar title="Releases" subtitle={`${releases.length} releases tracked`} highlight />
      <DataTable title="All Releases" subtitle="Sorted by target date" icon={Package}>
        <table className="w-full text-sm">
          <thead className={tableHeadRow}>
            <tr>
              <th className={`${tableCell} text-left font-medium`}>Version</th>
              <th className={`${tableCell} text-left font-medium`}>Name</th>
              <th className={`${tableCell} text-left font-medium`}>Team</th>
              <th className={`${tableCell} text-left font-medium`}>Owner</th>
              <th className={`${tableCell} text-left font-medium`}>Readiness</th>
              <th className={`${tableCell} text-left font-medium`}>Status</th>
              <th className={`${tableCell} text-left font-medium`}>Decision</th>
              <th className={`${tableCell} text-left font-medium`}>Target</th>
              <th className={`${tableCell} text-left font-medium`}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className={tableRow}>
                <td className={tableCell}><ProgressLink href={`/releases/${r.id}`} className="text-brand-500 font-medium hover:underline">{r.version}</ProgressLink></td>
                <td className={`${tableCell} text-gray-700`}>{r.name}</td>
                <td className={`${tableCell} text-gray-600`}>{r.team}</td>
                <td className={`${tableCell} text-gray-600`}>{r.owner}</td>
                <td className={tableCell}>{calcReadiness(r)}%</td>
                <td className={tableCell}><StatusBadge status={r.status} /></td>
                <td className={tableCell}><ReleaseDecisionBadge releaseId={r.id} fallback={r.decision} /></td>
                <td className={`${tableCell} text-gray-500`}>{formatDate(r.targetDate)}</td>
                <td className={tableCell}>{r.filesChanged > 400 && <Flag className="w-4 h-4 text-ai" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
