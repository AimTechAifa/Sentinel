"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { AlertTriangle, Calendar, Flag, Package } from "lucide-react";
import { EnvironmentDeskDashboardCard } from "@/components/environments/EnvironmentDeskDashboardCard";
import { NeedsAttentionPanel } from "@/components/dashboard/NeedsAttentionPanel";
import { UnifiedPortfolioPanel } from "@/components/dashboard/UnifiedPortfolioPanel";
import { DashboardChartsSection } from "@/components/dashboard/DashboardChartsSection";
import { DashboardP1Panel } from "@/components/dashboard/DashboardP1Panel";
import { FilteredReleasesTable } from "@/components/dashboard/FilteredReleasesTable";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { CrmStatCard } from "@/components/materio/crm/CrmStatCard";
import { AIPanel } from "@/components/ui/ai-panel";
import { callAgent } from "@/lib/agent-client";
import { buildDashboardSummaryContext } from "@/lib/summary-context";
import { filterLabel } from "@/lib/release-filters";
import { snapshotHeading } from "@/lib/period-labels";
import type { NeedsAttentionItem } from "@/lib/needs-attention";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Period } from "@/lib/period-range";
import type { ScheduleItem } from "@/components/materio/crm/MeetingScheduleList";
import type { ActivityItem } from "@/components/materio/crm/ActivityFeedCard";
import { buildSparkline, buildWeeklyOverview, pctChange } from "@/lib/materio/chart-data";
import { PRODUCT_TAGLINE } from "@/lib/brand";

type DashboardData = {
  counts: { planned: number; inProgress: number; blocked: number; atRisk: number; shipped: number };
  connectors: { name: string; lastSynced: string }[];
  p1Issues: { externalId: string; title: string; application: string | null; releaseCode: string | null; status: string }[];
};

type OverviewData = Parameters<typeof UnifiedPortfolioPanel>[0]["data"];

function isDashboardData(v: unknown): v is DashboardData {
  return !!v && typeof v === "object" && "counts" in v && "p1Issues" in v;
}

function buildFallbackSummary(dashboard: DashboardData, scopeLabel: string | null): string {
  const { counts, p1Issues } = dashboard;
  const scope = scopeLabel ?? "all departments, applications, and environments";
  const parts = [
    `${counts.planned} planned`,
    `${counts.inProgress} in progress`,
    `${counts.shipped} shipped`,
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
    filterQuery,
    hasRefinement,
    departments,
    applications,
    environments,
    filters,
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

  const statusCounts = useMemo(() => {
    if (overview?.counts?.combined) {
      const c = overview.counts.combined;
      return {
        planned: c.planned,
        blocked: c.blocked,
        shipped: c.shipped ?? 0,
        atRisk: c.atRisk,
        inProgress: c.inProgress,
      };
    }
    if (data?.counts) {
      return {
        planned: data.counts.planned,
        blocked: data.counts.blocked,
        shipped: data.counts.shipped ?? 0,
        atRisk: data.counts.atRisk,
        inProgress: data.counts.inProgress,
      };
    }
    return { planned: 0, blocked: 0, shipped: 0, atRisk: 0, inProgress: 0 };
  }, [overview, data]);

  const weekly = useMemo(() => buildWeeklyOverview(overview?.releases ?? []), [overview?.releases]);
  const spark = useMemo(() => buildSparkline(overview?.releases ?? []), [overview?.releases]);
  const lastWeek = weekly[weekly.length - 1]?.releases ?? 0;
  const prevWeek = weekly[weekly.length - 2]?.releases ?? 0;
  const plannedTrend = pctChange(lastWeek, prevWeek);

  const scheduleItems: ScheduleItem[] = useMemo(
    () =>
      attention.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.name,
        subtitle: a.reason,
        time: formatDate(a.date),
        status: a.status,
        href: a.href,
        avatarLabel: a.code.slice(0, 2),
      })),
    [attention]
  );

  const activityItems: ActivityItem[] = useMemo(
    () =>
      (data?.connectors ?? []).slice(0, 4).map((c, i) => ({
        id: c.name,
        title: `${c.name} synced`,
        description: "Connector refresh completed for release desk data.",
        time: formatDateTime(c.lastSynced),
        type: i === 0 ? "agent" : "release",
      })),
    [data?.connectors]
  );

  const statCards = [
    { title: "Planned", value: statusCounts.planned, icon: Calendar, color: "primary" as const, trend: plannedTrend, sparkline: spark },
    { title: "In progress", value: statusCounts.inProgress, icon: Package, color: "info" as const },
    { title: "Blocked", value: statusCounts.blocked, icon: AlertTriangle, color: "error" as const },
    { title: "At risk", value: statusCounts.atRisk, icon: Flag, color: "warning" as const },
  ];

  return (
    <Box className="materio-dashboard-grid">
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }} color="text.primary">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {hasRefinement ? `Portfolio summary · ${scopeLabel}` : "Portfolio summary"}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
          {PRODUCT_TAGLINE}
        </Typography>
      </Box>

      <AIPanel
        title="AI-Generated Daily Release Summary"
        agent="Summary Agent"
        loading={summaryLoading && !fetchError}
        error={fetchError ?? summaryError}
      >
        {summary && <p>{summary}</p>}
      </AIPanel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardP1Panel issues={data?.p1Issues ?? []} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <EnvironmentDeskDashboardCard />
        </Grid>
      </Grid>

      <ReleaseFiltersBar variant="large" period={period} onPeriodChange={setPeriod} />

      {data && (
        <>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }} color="text.primary">
              {snapshotHeading(period)}
            </Typography>
            <Grid container spacing={3}>
              {statCards.map((s) => (
                <Grid key={s.title} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <CrmStatCard
                    title={s.title}
                    value={s.value}
                    icon={s.icon}
                    color={s.color}
                    trend={s.trend}
                    sparkline={s.sparkline}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          <DashboardChartsSection
            releases={overview?.releases ?? []}
            scheduleItems={scheduleItems}
            activityItems={activityItems}
          />

          {overview && <FilteredReleasesTable releases={overview.releases} />}
        </>
      )}

      <NeedsAttentionPanel
        items={attention.slice(0, 8)}
        viewAllHref={`/inbox${filterQuery.replace(/^&/, "?")}`}
      />
    </Box>
  );
}
