"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ReleaseDecisionBadge } from "@/components/releases/ReleaseDecisionBadge";
import { releases } from "@/lib/dummy-data";
import { calcReadiness, formatDate } from "@/lib/utils";
import { Flag } from "lucide-react";

export default function ReleasesPage() {
  const sorted = [...releases].sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());
  return (
    <div>
      <TopBar title="Releases" subtitle={`${releases.length} releases tracked`} />
      <div className="ta-table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">Version</th>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Team</th>
              <th className="text-left p-3 font-medium">Owner</th>
              <th className="text-left p-3 font-medium">Readiness</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Decision</th>
              <th className="text-left p-3 font-medium">Target</th>
              <th className="text-left p-3 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3"><ProgressLink href={`/releases/${r.id}`} className="text-brand-500 font-medium hover:underline">{r.version}</ProgressLink></td>
                <td className="p-3 text-gray-700">{r.name}</td>
                <td className="p-3 text-gray-600">{r.team}</td>
                <td className="p-3 text-gray-600">{r.owner}</td>
                <td className="p-3">{calcReadiness(r)}%</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3"><ReleaseDecisionBadge releaseId={r.id} fallback={r.decision} /></td>
                <td className="p-3 text-gray-500">{formatDate(r.targetDate)}</td>
                <td className="p-3">{r.filesChanged > 400 && <Flag className="w-4 h-4 text-ai" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
