"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { buildEnvironmentDesk } from "@/lib/enterprise-env-data";
import { releases, services } from "@/lib/dummy-data";
import { AlertTriangle, GitBranch, Layers, Server } from "lucide-react";

const desk = buildEnvironmentDesk(releases, services);

export function EnvironmentDeskDashboardCard() {
  const { stats, alerts } = desk;
  const topAlert = alerts[0];

  return (
    <AdvancedCard
      variant="glass"
      icon={Server}
      title="Environment Desk"
      subtitle="Timeline · booking · versions · topology"
      action={
        <ProgressLink href="/environments" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Open desk →
        </ProgressLink>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatChip label="Booked" value={stats.bookedEnvs} icon={Server} />
        <StatChip label="Drift" value={stats.versionDrift} icon={Layers} warn={stats.versionDrift > 0} />
        <StatChip label="Conflicts" value={stats.bookingConflicts} icon={GitBranch} warn={stats.bookingConflicts > 0} />
        <StatChip label="Alerts" value={alerts.length} icon={AlertTriangle} warn={alerts.length > 0} />
      </div>
      {topAlert ? (
        <p className="text-xs text-gray-600 border-t border-gray-100 pt-3">
          <span className="font-semibold text-warning-700">Top priority:</span> {topAlert.title} — {topAlert.detail}
        </p>
      ) : (
        <p className="text-xs text-success-700 border-t border-gray-100 pt-3">
          All environment slots aligned — no drift or booking conflicts detected.
        </p>
      )}
    </AdvancedCard>
  );
}

function StatChip({
  label,
  value,
  icon: Icon,
  warn,
}: {
  label: string;
  value: number;
  icon: typeof Server;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${warn ? "border-warning-200 bg-warning-50/50" : "border-gray-100 bg-gray-50/50"}`}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-500">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="text-lg font-bold tabular-nums text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
