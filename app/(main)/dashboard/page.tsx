"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AIPanel } from "@/components/ui/ai-panel";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { callAgent } from "@/lib/agent-client";
import { useOrgContext } from "@/lib/use-org-context";
import { formatDateTime, cn } from "@/lib/utils";
import { AlertTriangle, Calendar, Clock, Flag, Package } from "lucide-react";
import { PRODUCT_TAGLINE } from "@/lib/brand";

type Period = "month" | "quarter" | "year";

type DashboardData = {
  counts: { planned: number; inProgress: number; blocked: number; atRisk: number };
  connectors: { name: string; lastSynced: string }[];
  p1Issues: { externalId: string; title: string; application: string | null; releaseCode: string | null; status: string }[];
};

export default function DashboardPage() {
  const orgContext = useOrgContext();
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard?period=${period}`)
      .then((r) => r.json())
      .then(setData);
  }, [period]);

  useEffect(() => {
    if (!data) return;
    callAgent({
      agentRole: "Summary Agent",
      context: { ...orgContext, dashboard: data, period },
    }).then((res) => {
      setSummary(res.text ?? null);
      setLoading(false);
    });
  }, [orgContext, data, period]);

  const metrics = useMemo(
    () =>
      data
        ? [
            { label: "Planned", value: data.counts.planned, icon: Calendar },
            { label: "In progress", value: data.counts.inProgress, icon: Package },
            { label: "Blocked", value: data.counts.blocked, icon: AlertTriangle },
            { label: "At risk", value: data.counts.atRisk, icon: Flag },
          ]
        : [],
    [data]
  );

  return (
    <div className="space-y-6">
      <TopBar title="Dashboard" subtitle="Portfolio summary" positioning={PRODUCT_TAGLINE} highlight />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1">
          {(["month", "quarter", "year"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                period === p ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {p}
            </button>
          ))}
        </div>
        {data?.connectors && (
          <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
            {data.connectors.map((c) => (
              <span key={c.name} className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {c.name}: {formatDateTime(c.lastSynced)}
              </span>
            ))}
          </div>
        )}
      </div>

      <AIPanel title="AI Daily Summary" agent="Summary Agent" loading={loading}>
        {summary && <p>{summary}</p>}
      </AIPanel>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon }, i) => (
          <MetricCard key={label} label={label} value={value} icon={icon} delay={i * 0.05} />
        ))}
      </div>

      <DataTable title="P1 Issues" subtitle="May require hotfix — release manager attention" icon={AlertTriangle}>
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadRow}>
              <th className={cn(tableCell, "text-left")}>ID</th>
              <th className={cn(tableCell, "text-left")}>Title</th>
              <th className={cn(tableCell, "text-left")}>Application</th>
              <th className={cn(tableCell, "text-left")}>Release</th>
              <th className={cn(tableCell, "text-left")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.p1Issues ?? []).map((issue) => (
              <tr key={issue.externalId} className={tableRow}>
                <td className={cn(tableCell, "font-mono text-xs")}>{issue.externalId}</td>
                <td className={tableCell}>{issue.title}</td>
                <td className={tableCell}>{issue.application ?? "—"}</td>
                <td className={tableCell}>{issue.releaseCode ?? "—"}</td>
                <td className={tableCell}>{issue.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
