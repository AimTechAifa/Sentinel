"use client";

import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import type { ApplicationConfig } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function AppConfigTable({ configs }: { configs: ApplicationConfig[] }) {
  const [selected, setSelected] = useState(configs[0]?.application ?? "SAP");
  const config = useMemo(() => configs.find((c) => c.application === selected), [configs, selected]);

  return (
    <DataTable
      title="Application Config"
      subtitle="URLs and feature flags per application"
      icon={Settings2}
      action={
        <div className="flex gap-1">
          {configs.map((c) => (
            <button
              key={c.application}
              type="button"
              onClick={() => setSelected(c.application)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                selected === c.application ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {c.application}
            </button>
          ))}
        </div>
      }
    >
      {config && (
        <div className="p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ConfigField label="Base URL" value={config.baseUrl} mono />
            <ConfigField label="API URL" value={config.apiUrl} mono />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Feature Flags</p>
            <table className="w-full text-sm">
              <thead>
                <tr className={tableHeadRow}>
                  <th className={cn(tableCell, "text-left font-medium")}>Flag</th>
                  <th className={cn(tableCell, "text-left font-medium")}>Environment</th>
                  <th className={cn(tableCell, "text-left font-medium")}>Status</th>
                </tr>
              </thead>
              <tbody>
                {config.featureFlags.map((flag) => (
                  <tr key={flag.name} className={tableRow}>
                    <td className={cn(tableCell, "font-mono text-xs text-gray-700")}>{flag.name}</td>
                    <td className={tableCell}>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {flag.environment}
                      </span>
                    </td>
                    <td className={tableCell}>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                          flag.enabled ? "bg-success-100 text-success-700" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400">Last updated {formatDate(config.lastUpdated)}</p>
        </div>
      )}
    </DataTable>
  );
}

function ConfigField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={cn("text-sm text-gray-800 mt-0.5 truncate", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}
