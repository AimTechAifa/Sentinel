"use client";

import { useEffect, useState } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { callAgent } from "@/lib/agent-client";
import { releases, activityFeed, getOrgContext } from "@/lib/dummy-data";
import { RiskHoverCell } from "@/components/dashboard/RiskHoverCell";
import { ReleaseDecisionBadge } from "@/components/releases/ReleaseDecisionBadge";
import { calcReadiness, formatDate, getOrgStats, medianFilesChanged } from "@/lib/utils";
import { taMetricIcon, taTableWrap } from "@/lib/styles";
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
        <TopBar title="Dashboard" subtitle="Executive release overview" />
      </div>

      {metrics.map(({ label, value, icon: Icon }) => (
        <div key={label} className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="ta-card">
            <div className={taMetricIcon}>
              <Icon className="h-6 w-6 text-gray-800" />
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-500">{label}</span>
              <h4 className="mt-2 text-title-sm font-bold text-gray-800">{value}</h4>
            </div>
          </div>
        </div>
      ))}

      <div className="col-span-12">
        <div className="ai-card p-5 md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">AI Daily Summary</h2>
            <AgentBadge agent="Summary Agent" />
          </div>
          {loading && <AICardSkeleton />}
          {error && !loading && <p className="text-sm text-error-600">{error}</p>}
          {summary && !loading && <p className="text-sm leading-relaxed text-gray-600">{summary}</p>}
        </div>
      </div>

      <div className="col-span-12 xl:col-span-8">
        <div className={taTableWrap}>
          <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
            <Package className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-800">Active Releases</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-theme-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-left font-medium">Version</th>
                  <th className="p-3 text-left font-medium">Team</th>
                  <th className="p-3 text-left font-medium">Readiness</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Decision</th>
                  <th className="p-3 text-left font-medium">Target</th>
                  <th className="p-3 text-left font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {activeReleases.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <ProgressLink href={`/releases/${r.id}`} className="font-medium text-brand-500 hover:text-brand-600">
                        {r.version}
                      </ProgressLink>
                    </td>
                    <td className="p-3 text-gray-600">{r.team}</td>
                    <td className="p-3 text-gray-800">{calcReadiness(r)}%</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                    <td className="p-3"><ReleaseDecisionBadge releaseId={r.id} fallback={r.decision} /></td>
                    <td className="p-3 text-gray-500">{formatDate(r.targetDate)}</td>
                    <td className="p-3">
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
          </div>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-4">
        <div className="ta-card h-full">
          <h3 className="mb-4 font-semibold text-gray-800">Recent Activity</h3>
          <div className="space-y-3">
            {activityFeed.slice(0, 6).map((a) => (
              <div key={a.id} className="border-b border-gray-100 pb-3 text-sm last:border-0">
                {a.type === "agent" && a.agent && <AgentBadge agent={a.agent} className="mb-1" />}
                <p className="text-gray-700">{a.message}</p>
                <p className="mt-1 text-theme-xs text-gray-400">{a.actor} · {formatDate(a.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
