"use client";

import { useMemo } from "react";
import Grid from "@mui/material/Grid";
import { WeeklyOverviewChart } from "@/components/materio/crm/WeeklyOverviewChart";
import { TotalGrowthChart } from "@/components/materio/crm/TotalGrowthChart";
import { MeetingScheduleList, type ScheduleItem } from "@/components/materio/crm/MeetingScheduleList";
import { ActivityFeedCard, type ActivityItem } from "@/components/materio/crm/ActivityFeedCard";
import { UpgradePlanCard } from "@/components/materio/crm/UpgradePlanCard";
import { buildGrowthSeries, buildWeeklyOverview } from "@/lib/materio/chart-data";

type Props = {
  releases: { releaseDate?: string | Date | null; date?: string; status?: string }[];
  scheduleItems?: ScheduleItem[];
  activityItems?: ActivityItem[];
  upgradeTitle?: string;
  upgradeDescription?: string;
  upgradeCtaLabel?: string;
  upgradeCtaHref?: string;
};

export function DashboardChartsSection({
  releases,
  scheduleItems = [],
  activityItems = [],
  upgradeTitle,
  upgradeDescription,
  upgradeCtaLabel,
  upgradeCtaHref,
}: Props) {
  const weekly = useMemo(() => buildWeeklyOverview(releases), [releases]);
  const growth = useMemo(() => buildGrowthSeries(releases), [releases]);

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <WeeklyOverviewChart data={weekly} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <UpgradePlanCard
            title={upgradeTitle}
            description={upgradeDescription}
            ctaLabel={upgradeCtaLabel}
            ctaHref={upgradeCtaHref}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <TotalGrowthChart data={growth} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <MeetingScheduleList items={scheduleItems} />
        </Grid>
      </Grid>

      {activityItems.length > 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <ActivityFeedCard items={activityItems} />
          </Grid>
        </Grid>
      )}
    </>
  );
}
