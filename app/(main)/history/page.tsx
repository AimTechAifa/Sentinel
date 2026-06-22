import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { getAllHistory } from "@/lib/dummy-data";
import { formatDateTime } from "@/lib/utils";

export default function HistoryPage() {
  const history = getAllHistory();
  return (
    <div>
      <TopBar title="History Log" subtitle="Global audit trail across all releases" />
      <div className="bg-white ta-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left p-3 font-medium">Timestamp</th>
              <th className="text-left p-3 font-medium">Release</th>
              <th className="text-left p-3 font-medium">Actor</th>
              <th className="text-left p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 50).map((h) => (
              <tr key={h.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-gray-500">{formatDateTime(h.timestamp)}</td>
                <td className="p-3"><ProgressLink href={`/releases/${h.releaseId}`} className="text-brand-500 hover:underline">{h.releaseName}</ProgressLink></td>
                <td className="p-3">
                  {h.type === "agent" && h.agent ? <AgentBadge agent={h.agent} /> : <span className="text-gray-700">{h.actor}</span>}
                </td>
                <td className="p-3 text-gray-600">{h.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
