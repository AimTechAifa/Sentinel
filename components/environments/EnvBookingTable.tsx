"use client";

import { useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import type { EnvBooking } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  IDLE: "bg-gray-100 text-gray-600",
  BOOKED: "bg-brand-100 text-brand-700",
  MAINTENANCE: "bg-warning-100 text-warning-700",
};

export function EnvBookingTable({ bookings }: { bookings: EnvBooking[] }) {
  const systems = useMemo(() => Array.from(new Set(bookings.map((b) => b.system))), [bookings]);
  const [system, setSystem] = useState(systems[0] ?? "SAP");

  const rows = useMemo(() => bookings.filter((b) => b.system === system), [bookings, system]);

  return (
    <DataTable
      title="Environment Booking"
      subtitle="Monthly environment reservations by system"
      icon={CalendarCheck}
      action={
        <div className="flex gap-1">
          {systems.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSystem(s)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                system === s ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      }
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRow}>
            <th className={cn(tableCell, "text-left font-medium")}>Month</th>
            <th className={cn(tableCell, "text-left font-medium")}>Status</th>
            <th className={cn(tableCell, "text-left font-medium")}>Team</th>
            <th className={cn(tableCell, "text-left font-medium")}>Purpose</th>
            <th className={cn(tableCell, "text-left font-medium")}>Contact</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={tableRow}>
              <td className={cn(tableCell, "font-medium text-gray-800")}>{row.month}</td>
              <td className={tableCell}>
                <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", statusStyles[row.status])}>
                  {row.status}
                </span>
              </td>
              <td className={cn(tableCell, "text-gray-600")}>{row.team ?? "—"}</td>
              <td className={cn(tableCell, "text-gray-600")}>{row.purpose ?? "—"}</td>
              <td className={cn(tableCell, "text-gray-600")}>{row.contact ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}
