"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AIPanel } from "@/components/ui/ai-panel";
import { MetricCard } from "@/components/ui/metric-card";
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
        highlight
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {metrics.map(({ label, value, icon: Icon }, i) => (
          <div key={label} className="col-span-6 sm:col-span-4 xl:col-span-2">
            <MetricCard label={label} value={value} icon={Icon} delay={i * 0.06} />
          </div>
        ))}
      </div>

      <AIPanel title="Executive Briefing" agent="Summary Agent" loading={loading}>
        {summary && <p>{summary}</p>}
      </AIPanel>

      <TeamRiskHeatmap data={heatmap} />
      <ReleasesAtRiskTable predictions={predictions} />
      <PredictiveForecastPanel predictions={predictions} />
    </div>
  );
}
