"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { TeamRiskHeatmap } from "@/components/executive/TeamRiskHeatmap";
import { ReleasesAtRiskTable } from "@/components/executive/ReleasesAtRiskTable";
import { PredictiveForecastPanel } from "@/components/predictive/PredictiveForecastPanel";
import { callAgent } from "@/lib/agent-client";
import { getExecutiveContext, releases, services } from "@/lib/dummy-data";
import {
  getPortfolioStats,
  getTeamRiskHeatmap,
  predictAllReleases,
} from "@/lib/predictive";
import { taMetricIcon } from "@/lib/styles";
import { Briefcase, TrendingDown, TrendingUp, AlertTriangle, Calendar, Brain } from "lucide-react";

export default function ExecutivePage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const unstableIds = useMemo(() => services.filter((s) => s.unstable).map((s) => s.id), []);
  const predictions = useMemo(() => predictAllReleases(releases, unstableIds), [unstableIds]);
  const heatmap = useMemo(() => getTeamRiskHeatmap(releases), []);
  const portfolio = useMemo(() => getPortfolioStats(releases, predictions), [predictions]);

  useEffect(() => {
    callAgent({
      agentRole: "Summary Agent",
      context: getExecutiveContext(predictions, portfolio),
    }).then((res) => {
      setSummary(res.text ?? null);
      setLoading(false);
    });
  }, [predictions, portfolio]);

  const metrics = [
    { label: "Active releases", value: portfolio.activeCount, icon: Briefcase },
    { label: "At risk / blocked", value: portfolio.atRiskCount, icon: AlertTriangle },
    { label: "Avg ship success (ML)", value: `${portfolio.avgShipSuccess}%`, icon: Brain },
    { label: "Shipping this week", value: portfolio.shippingThisWeek, icon: Calendar },
    { label: "High rollback forecast", value: portfolio.highRollbackCount, icon: TrendingDown },
    { label: "Org avg readiness", value: `${portfolio.avgReadiness}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <TopBar
        title="Executive Dashboard"
        subtitle="Portfolio view — risk heatmap, ML forecasts, and board-ready metrics"
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="col-span-6 sm:col-span-4 xl:col-span-2">
            <div className="ta-card">
              <div className={taMetricIcon}>
                <Icon className="h-5 w-5 text-gray-800" />
              </div>
              <div className="mt-4">
                <span className="text-xs text-gray-500">{label}</span>
                <h4 className="mt-1 text-title-sm font-bold text-gray-800">{value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ai-card p-5 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Executive Briefing</h2>
          <AgentBadge agent="Summary Agent" />
        </div>
        {loading && <AICardSkeleton />}
        {summary && !loading && <p className="text-sm leading-relaxed text-gray-600">{summary}</p>}
      </div>

      <TeamRiskHeatmap data={heatmap} />
      <ReleasesAtRiskTable predictions={predictions} />
      <PredictiveForecastPanel predictions={predictions} />
    </div>
  );
}
