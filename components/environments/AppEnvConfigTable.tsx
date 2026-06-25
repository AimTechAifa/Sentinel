"use client";

import { useMemo } from "react";
import { Server } from "lucide-react";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import type { ApplicationEnvConfig } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function AppEnvConfigTable({
  configs,
  selectedApp,
  onSelectApp,
}: {
  configs: ApplicationEnvConfig[];
  selectedApp?: string | null;
  onSelectApp?: (app: string) => void;
}) {
  const apps = useMemo(() => Array.from(new Set(configs.map((c) => c.application))), [configs]);
  const app = selectedApp && apps.includes(selectedApp) ? selectedApp : apps[0] ?? "SAP";

  const rows = useMemo(() => configs.filter((c) => c.application === app), [configs, app]);

  return (
    <DataTable
      title="Application Env Config"
      subtitle="Cluster, pipeline, and namespace from release deployment configs"
      icon={Server}
      action={
        <div className="flex gap-1 flex-wrap">
          {apps.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onSelectApp?.(a)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                app === a ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      }
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRow}>
            <th className={cn(tableCell, "text-left font-medium")}>Environment</th>
            <th className={cn(tableCell, "text-left font-medium")}>Infra</th>
            <th className={cn(tableCell, "text-left font-medium")}>Firewall</th>
            <th className={cn(tableCell, "text-left font-medium")}>Network Zone</th>
            <th className={cn(tableCell, "text-left font-medium")}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.application}-${row.environment}`} className={tableRow}>
              <td className={tableCell}>
                <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {row.environment}
                </span>
              </td>
              <td className={cn(tableCell, "text-gray-600 max-w-[200px] font-mono text-xs")}>{row.infra}</td>
              <td className={cn(tableCell, "text-gray-600 max-w-[180px]")}>{row.firewall}</td>
              <td className={cn(tableCell, "text-gray-600")}>{row.networkZone}</td>
              <td className={cn(tableCell, "text-gray-400 text-xs font-mono text-[10px] uppercase tracking-wider whitespace-nowrap")}>
                {formatDate(row.lastUpdated)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}
