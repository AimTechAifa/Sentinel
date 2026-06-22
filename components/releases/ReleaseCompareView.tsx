"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { ReleaseCompareSnapshot } from "@/lib/release-comparison";
import { compareMetric } from "@/lib/release-comparison";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Minus } from "lucide-react";

function DeltaBadge({ side }: { side: "better" | "worse" | "neutral" }) {
  if (side === "neutral") return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  if (side === "better") return <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />;
  return <AlertTriangle className="w-3.5 h-3.5 text-error-500" />;
}

function CompareColumn({
  snapshot,
  accent,
}: {
  snapshot: ReleaseCompareSnapshot;
  accent: "left" | "right";
}) {
  return (
    <AdvancedCard
      variant={accent === "left" ? "ai" : "glass"}
      className="h-full"
      innerClassName="p-5"
    >
      <div className="mb-4">
        <ProgressLink href={`/releases/${snapshot.releaseId}`} className="text-xl font-bold text-brand-500 hover:text-brand-600">
          {snapshot.version}
        </ProgressLink>
        <p className="text-sm text-gray-600 mt-0.5">{snapshot.name}</p>
        <p className="text-xs text-gray-400">{snapshot.team}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <StatusBadge status={snapshot.status} />
          {snapshot.decision && <StatusBadge status={snapshot.decision} />}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center rounded-lg bg-white/60 px-3 py-2 border border-gray-100">
          <span className="text-gray-500">Readiness</span>
          <span className="text-2xl font-bold text-gray-800 tabular-nums">{snapshot.readiness}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Approvals</span>
          <span className="font-medium">{snapshot.approvedGates}/{snapshot.totalGates} approved</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Build</span>
          <StatusBadge status={snapshot.buildStatus} />
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Files changed</span>
          <span className="font-medium tabular-nums">{snapshot.filesChanged}</span>
        </div>
        {snapshot.shipSuccessPct != null && (
          <div className="flex justify-between">
            <span className="text-gray-500">ML ship success</span>
            <span className="font-bold tabular-nums">{snapshot.shipSuccessPct}%</span>
          </div>
        )}
        {snapshot.rollbackRiskPct != null && (
          <div className="flex justify-between">
            <span className="text-gray-500">ML rollback risk</span>
            <span className="font-bold tabular-nums text-error-600">{snapshot.rollbackRiskPct}%</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-2">Blockers ({snapshot.blockers.length})</p>
        {snapshot.blockers.length === 0 ? (
          <p className="text-sm text-emerald-600">None — clear to ship</p>
        ) : (
          <ul className="space-y-1.5">
            {snapshot.blockers.map((b) => (
              <li key={b} className="text-xs text-gray-700 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdvancedCard>
  );
}

export function ReleaseCompareView({
  left,
  right,
}: {
  left: ReleaseCompareSnapshot;
  right: ReleaseCompareSnapshot;
}) {
  const rows = [
    {
      label: "Readiness",
      leftVal: left.readiness,
      rightVal: right.readiness,
      higherBetter: true,
      fmt: (v: number) => `${v}%`,
    },
    {
      label: "Open blockers",
      leftVal: left.blockers.length,
      rightVal: right.blockers.length,
      higherBetter: false,
      fmt: (v: number) => String(v),
    },
    {
      label: "Pending approvals",
      leftVal: left.pendingApprovals,
      rightVal: right.pendingApprovals,
      higherBetter: false,
      fmt: (v: number) => String(v),
    },
    {
      label: "Files changed",
      leftVal: left.filesChanged,
      rightVal: right.filesChanged,
      higherBetter: false,
      fmt: (v: number) => String(v),
    },
    ...(left.shipSuccessPct != null && right.shipSuccessPct != null
      ? [
          {
            label: "ML ship success",
            leftVal: left.shipSuccessPct,
            rightVal: right.shipSuccessPct,
            higherBetter: true,
            fmt: (v: number) => `${v}%`,
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
      <CompareColumn snapshot={left} accent="left" />

      <AdvancedCard variant="plain" className="hidden xl:block xl:w-56" innerClassName="p-4">
        <p className="text-xs font-semibold uppercase text-gray-400 mb-3 text-center">Delta</p>
        <div className="space-y-3">
          {rows.map((row) => {
            const leftSide = compareMetric(row.leftVal, row.rightVal, row.higherBetter);
            const rightSide = compareMetric(row.rightVal, row.leftVal, row.higherBetter);
            return (
              <div key={row.label} className="text-center">
                <p className="text-[10px] text-gray-500 mb-1">{row.label}</p>
                <div className="flex items-center justify-center gap-4 text-xs font-medium">
                  <span className={cn(leftSide === "better" && "text-success-600")}>{row.fmt(row.leftVal)}</span>
                  <span className="text-gray-300">vs</span>
                  <span className={cn(rightSide === "better" && "text-success-600")}>{row.fmt(row.rightVal)}</span>
                </div>
                <div className="flex justify-center gap-6 mt-1">
                  <DeltaBadge side={leftSide} />
                  <DeltaBadge side={rightSide} />
                </div>
              </div>
            );
          })}
        </div>
      </AdvancedCard>

      <CompareColumn snapshot={right} accent="right" />
    </div>
  );
}
