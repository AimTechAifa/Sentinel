"use client";

import { MagicCard } from "@/components/ui/magic-card";
import type { LucideIcon } from "lucide-react";

interface DataTableProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ title, subtitle, icon: Icon, action, children, className }: DataTableProps) {
  return (
    <MagicCard
      gradient="from-gray-200/70 via-white to-gray-200/70"
      className={className}
      innerClassName="overflow-hidden"
    >
      {(title || Icon) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/90 via-white to-gray-50/90 px-5 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                <Icon className="h-4 w-4 text-brand-500" />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </MagicCard>
  );
}

export const tableHeadRow = "bg-gradient-to-r from-gray-50 to-white text-gray-500";
export const tableRow = "border-t border-gray-100 hover:bg-brand-50/30 transition-colors";
export const tableCell = "p-3";
