"use client";

import { Layers } from "lucide-react";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import type { ApplicationVersionRow } from "@/lib/types";
import { cn } from "@/lib/utils";

function versionClass(current: string, prod: string) {
  if (current === prod) return "text-success-700 bg-success-50";
  return "text-brand-700 bg-brand-50";
}

export function VersionMatrix({ rows }: { rows: ApplicationVersionRow[] }) {
  return (
    <DataTable
      title="Current Version"
      subtitle="Application versions deployed across DEV, TEST, and PROD"
      icon={Layers}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRow}>
            <th className={cn(tableCell, "text-left font-medium")}>Application</th>
            <th className={cn(tableCell, "text-left font-medium")}>DEV</th>
            <th className={cn(tableCell, "text-left font-medium")}>TEST</th>
            <th className={cn(tableCell, "text-left font-medium")}>PROD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.application} className={tableRow}>
              <td className={cn(tableCell, "font-semibold text-gray-800")}>{row.application}</td>
              <td className={tableCell}>
                <VersionBadge version={row.dev} ahead={row.dev !== row.prod} />
              </td>
              <td className={tableCell}>
                <VersionBadge version={row.test} ahead={row.test !== row.prod} />
              </td>
              <td className={tableCell}>
                <VersionBadge version={row.prod} prod />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}

function VersionBadge({ version, ahead, prod }: { version: string; ahead?: boolean; prod?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums",
        prod ? "bg-gray-100 text-gray-700" : versionClass(version, prod ? version : "")
      )}
    >
      {version}
      {ahead && !prod && <span className="ml-1 text-[10px] font-normal opacity-60">↑</span>}
    </span>
  );
}
