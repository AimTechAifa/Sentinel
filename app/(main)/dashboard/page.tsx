"use client";

import { useEffect, useMemo, useState } from "react";
import { EnvironmentDeskDashboardCard } from "@/components/environments/EnvironmentDeskDashboardCard";
import { NeedsAttentionPanel } from "@/components/dashboard/NeedsAttentionPanel";
import { UnifiedPortfolioPanel } from "@/components/dashboard/UnifiedPortfolioPanel";
import { TopBar } from "@/components/layout/TopBar";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { AIPanel } from "@/components/ui/ai-panel";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { callAgent } from "@/lib/agent-client";
import { buildDashboardSummaryContext } from "@/lib/summary-context";
import { filterLabel } from "@/lib/release-filters";
import type { NeedsAttentionItem } from "@/lib/needs-attention";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { formatDateTime, cn } from "@/lib/utils";
import { AlertTriangle, Calendar, Clock, Flag, Package } from "lucide-react";
import { PRODUCT_TAGLINE } from "@/lib/brand";

type Period = "month" | "quarter" | "year";

type DashboardData = {
  counts: { planned: number; inProgress: number; blocked: number; atRisk: number };
  connectors: { name: string; lastSynced: string }[];
  p1Issues: { externalId: string; title: string; application: string | null; releaseCode: string | null; status: string }[];
};

type OverviewData = Parameters<typeof UnifiedPortfolioPanel>[0]["data"];

function isDashboardData(v: unknown): v is DashboardData {
  return !!v && typeof v === "object" && "counts" in v && "p1Issues" in v;
}

function buildFallbackSummary(
  dashboard: DashboardData,
  scopeLabel: string | null
): string {
  const { counts, p1Issues } = dashboard;
  const scope = scopeLabel ?? "all departments, applications, and environments";
  const parts = [
    `${counts.planned} planned`,
    `${counts.inProgress} in progress`,
    counts.blocked ? `${counts.blocked} blocked` : null,
    counts.atRisk ? `${counts.atRisk} at risk` : null,
  ].filter(Boolean);
  const p1Line =
    p1Issues.length > 0
      ? ` ${p1Issues.length} open P1 issue${p1Issues.length === 1 ? "" : "s"} require release manager attention.`
      : " No open P1 issues in scope.";
  return `Portfolio summary for ${scope}: ${parts.join(", ")}.${p1Line}`;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [attention, setAttention] = useState<NeedsAttentionItem[]>([]);

  const {
    filters,
    filterQuery,
    hasRefinement,
    departments,
    applications,
    environments,
  } = useReleaseFilters();

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  useEffect(() => {
    setFetchError(null);
    setData(null);
    setOverview(null);
    setSummary(null);
    setSummaryError(null);
    setSummaryLoading(false);
    setAttention([]);

    const dashUrl = `/api/dashboard?period=${period}${filterQuery}`;
    const overviewUrl = `/api/unified/overview?period=${period}${filterQuery}`;
    const attentionUrl = `/api/needs-attention?period=${period}${filterQuery}`;

    let cancelled = false;

    Promise.all([
      fetch(dashUrl).then(async (r) => (r.ok ? r.json() : Promise.reject(new Error("Dashboard load failed")))),
      fetch(overviewUrl).then(async (r) => (r.ok ? r.json() : Promise.reject(new Error("Overview load failed")))),
      fetch(attentionUrl).then(async (r) => (r.ok ? r.json() : { items: [] })),
    ])
      .then(([dash, ov, att]) => {
        if (cancelled) return;
        if (!isDashboardData(dash)) {
          setFetchError("Dashboard data was invalid");
          return;
        }
        setData(dash);
        setOverview(ov);
        setAttention(Array.isArray(att.items) ? att.items : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setFetchError(e instanceof Error ? e.message : "Failed to load dashboard data");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [period, filterQuery]);

  useEffect(() => {
    if (!data || !overview) return;

    let cancelled = false;
    setSummaryLoading(true);
    setSummary(null);
    setSummaryError(null);

    const fallback = buildFallbackSummary(data, scopeLabel);

    callAgent({
      agentRole: "Summary Agent",
      context: buildDashboardSummaryContext({
        period,
        dashboard: data,
        overview,
        filterScope: scopeLabel,
      }),
    })
      .then((res) => {
        if (cancelled) return;
        const text = res.text?.trim();
        if (text) {
          setSummary(text);
          return;
        }
        const err = res.error ?? "";
        if (/api key|llm|unavailable|timed out/i.test(err)) {
          setSummary(fallback);
          setSummaryError(null);
        } else {
          setSummaryError(err || "AI summary unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(fallback);
          setSummaryError(null);
        }
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data, overview, period, scopeLabel]);

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
      <TopBar
        title="Dashboard"
        subtitle={hasRefinement ? `Portfolio summary · ${scopeLabel}` : "Portfolio summary"}
        positioning={PRODUCT_TAGLINE}
        highlight
      />

      <ReleaseFiltersBar />

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

      <AIPanel
        title="AI Daily Summary"
        agent="Summary Agent"
        loading={summaryLoading && !fetchError}
        error={fetchError ?? summaryError}
      >
        {summary && <p>{summary}</p>}
      </AIPanel>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon }, i) => (
          <MetricCard key={label} label={label} value={value} icon={icon} delay={i * 0.05} />
        ))}
      </div>

      <NeedsAttentionPanel
        items={attention.slice(0, 8)}
        viewAllHref={`/inbox${filterQuery.replace(/^&/, "?")}`}
      />

      {overview && <UnifiedPortfolioPanel data={overview} />}

      <EnvironmentDeskDashboardCard />

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
