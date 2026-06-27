"use client";

import { useEffect, useState } from "react";
import { GitCompareArrows } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { cn, formatDate } from "@/lib/utils";

type DriftRow = {
  id: string;
  driftCode: string;
  release: { id: string; releaseCode: string; name: string; status: string };
  application: { id: string; name: string };
  environmentName: string;
  driftType: string;
  driftCategory: string | null;
  detectedDate: string;
  severity: string;
  description: string;
  impactOnRelease: string | null;
  remediationAction: string | null;
  status: string;
  etaToFix: string | null;
};

const SEVERITY_CLASSES: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
};

import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";

export default function DriftDashboardContent() {
  const [drifts, setDrifts] = useState<DriftRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/drifts")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDrifts(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <TopBar
        title="Drift Dashboard"
        subtitle={`${drifts.length} drift${drifts.length === 1 ? "" : "s"} detected across environments`}
      />

      {loading ? (
        <p className="text-gray-500 p-6">Loading…</p>
      ) : drifts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <GitCompareArrows className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No drift detected. All environments are in sync.</p>
        </div>
      ) : (
        <DataTable title="All Drifts" subtitle="Sorted by detected date" icon={GitCompareArrows}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHeadRow}>
                <tr>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Drift Code</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Release</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Application</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Environment</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Type</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Category</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Detected Date</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Severity</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Description</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Impact</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Remediation</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>Status</th>
                  <th className={`${tableCell} text-left font-medium whitespace-nowrap`}>ETA</th>
                </tr>
              </thead>
              <tbody>
                {drifts.map((d) => (
                  <tr key={d.id} className={tableRow}>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{d.driftCode}</span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <ProgressLink href={`/releases/${d.release.id}`} className="text-brand-600 dark:text-brand-400 hover:underline text-xs">
                        {d.release.releaseCode}
                      </ProgressLink>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap`}>{d.application.name}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{d.environmentName}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{d.driftType}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>{d.driftCategory ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{formatDate(d.detectedDate)}</td>
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", SEVERITY_CLASSES[d.severity] ?? SEVERITY_CLASSES.Medium)}>
                        {d.severity}
                      </span>
                    </td>
                    <td className={`${tableCell} truncate max-w-[200px]`} title={d.description}>{d.description}</td>
                    <td className={`${tableCell} truncate max-w-[200px] whitespace-nowrap`} title={d.impactOnRelease ?? ""}>{d.impactOnRelease ?? "—"}</td>
                    <td className={`${tableCell} truncate max-w-[200px] whitespace-nowrap`} title={d.remediationAction ?? ""}>{d.remediationAction ?? "—"}</td>
                    <td className={`${tableCell} whitespace-nowrap`}><StatusBadge status={d.status} /></td>
                    <td className={`${tableCell} whitespace-nowrap text-gray-500`}>{d.etaToFix ? formatDate(d.etaToFix) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      )}
    </div>
  );
}
