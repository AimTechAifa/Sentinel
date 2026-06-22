"use client";

import { useEffect, useState } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AIPanel } from "@/components/ui/ai-panel";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { callAgent } from "@/lib/agent-client";
import { releases, activityFeed, getOrgContext } from "@/lib/dummy-data";
import { RiskHoverCell } from "@/components/dashboard/RiskHoverCell";
import { ReleaseDecisionBadge } from "@/components/releases/ReleaseDecisionBadge";
import { calcReadiness, formatDate, getOrgStats, medianFilesChanged } from "@/lib/utils";
import { Flag, TrendingUp, AlertTriangle, Clock, Package } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskCache, setRiskCache] = useState<Record<string, { text?: string; error?: string }>>({});
  const stats = getOrgStats(releases);
  const median = medianFilesChanged(releases);

  useEffect(() => {
    callAgent({ agentRole: "Summary Agent", context: getOrgContext() }).then((res) => {
      if (res.text) setSummary(res.text);
      else setError(res.error ?? "AI unavailable");
      setLoading(false);
    });
  }, []);

  const activeReleases = releases.filter((r) => r.status !== "Shipped").slice(0, 8);

  const metrics = [
    { label: "Releases this week", value: stats.thisWeek, icon: TrendingUp },
    { label: "Org avg readiness", value: `${stats.avgReadiness}%`, icon: Clock },
    { label: "Open blockers", value: stats.openBlockers, icon: AlertTriangle },
    { label: "Approvals pending", value: stats.pendingApprovals, icon: Flag },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <TopBar title="Dashboard" subtitle="Executive release overview" highlight />
      </div>

      {metrics.map(({ label, value, icon: Icon }, i) => (
        <div key={label} className="col-span-12 sm:col-span-6 xl:col-span-3">
          <MetricCard label={label} value={value} icon={Icon} delay={i * 0.08} />
        </div>
      ))}

      <div className="col-span-12">
        <AIPanel title="AI Daily Summary" agent="Summary Agent" loading={loading} error={error}>
          {summary && <p>{summary}</p>}
        </AIPanel>
      </div>

      <div className="col-span-12 xl:col-span-8">
        <DataTable title="Active Releases" icon={Package}>
          <table className="w-full text-theme-sm">
            <thead className={tableHeadRow}>
              <tr>
                <th className={`${tableCell} text-left font-medium`}>Version</th>
                <th className={`${tableCell} text-left font-medium`}>Team</th>
                <th className={`${tableCell} text-left font-medium`}>Readiness</th>
                <th className={`${tableCell} text-left font-medium`}>Status</th>
                <th className={`${tableCell} text-left font-medium`}>Decision</th>
                <th className={`${tableCell} text-left font-medium`}>Target</th>
                <th className={`${tableCell} text-left font-medium`}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {activeReleases.map((r) => (
                <tr key={r.id} className={tableRow}>
                  <td className={tableCell}>
                    <ProgressLink href={`/releases/${r.id}`} className="font-medium text-brand-500 hover:text-brand-600">
                      {r.version}
                    </ProgressLink>
                  </td>
                  <td className={`${tableCell} text-gray-600`}>{r.team}</td>
                  <td className={`${tableCell} text-gray-800`}>{calcReadiness(r)}%</td>
                  <td className={tableCell}><StatusBadge status={r.status} /></td>
                  <td className={tableCell}><ReleaseDecisionBadge releaseId={r.id} fallback={r.decision} /></td>
                  <td className={`${tableCell} text-gray-500`}>{formatDate(r.targetDate)}</td>
                  <td className={tableCell}>
                    <RiskHoverCell
                      release={r}
                      median={median}
                      cache={riskCache}
                      onCacheUpdate={(id, entry) => setRiskCache((c) => ({ ...c, [id]: entry }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </div>

      <div className="col-span-12 xl:col-span-4">
        <AdvancedCard title="Recent Activity" variant="glass" className="h-full">
          <div className="space-y-3">
            {activityFeed.slice(0, 6).map((a) => (
              <div key={a.id} className="border-b border-gray-100 pb-3 text-sm last:border-0">
                {a.type === "agent" && a.agent && <AgentBadge agent={a.agent} className="mb-1" />}
                <p className="text-gray-700">{a.message}</p>
                <p className="mt-1 text-theme-xs text-gray-400">{a.actor} · {formatDate(a.timestamp)}</p>
              </div>
            ))}
          </div>
        </AdvancedCard>
      </div>
    </div>
  );
}
