"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { getAllHistory } from "@/lib/dummy-data";
import { formatDateTime } from "@/lib/utils";
import { ScrollText } from "lucide-react";

export default function HistoryPage() {
  const history = getAllHistory();
  return (
    <div>
      <TopBar title="History Log" subtitle="Global audit trail across all releases" highlight />
      <DataTable title="Audit Trail" subtitle="Last 50 events" icon={ScrollText}>
        <table className="w-full text-sm">
          <thead className={tableHeadRow}>
            <tr>
              <th className={`${tableCell} text-left font-medium`}>Timestamp</th>
              <th className={`${tableCell} text-left font-medium`}>Release</th>
              <th className={`${tableCell} text-left font-medium`}>Actor</th>
              <th className={`${tableCell} text-left font-medium`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 50).map((h) => (
              <tr key={h.id} className={tableRow}>
                <td className={`${tableCell} text-gray-500`}>{formatDateTime(h.timestamp)}</td>
                <td className={tableCell}><ProgressLink href={`/releases/${h.releaseId}`} className="text-brand-500 hover:underline">{h.releaseName}</ProgressLink></td>
                <td className={tableCell}>
                  {h.type === "agent" && h.agent ? <AgentBadge agent={h.agent} /> : <span className="text-gray-700">{h.actor}</span>}
                </td>
                <td className={`${tableCell} text-gray-600`}>{h.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
