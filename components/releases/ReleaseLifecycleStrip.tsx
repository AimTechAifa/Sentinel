"use client";

import {
  Calendar,
  Check,
  ClipboardCheck,
  GitBranch,
  Rocket,
  Settings2,
  TestTube2,
} from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { LifecycleStageView } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons: Record<string, typeof GitBranch> = {
  planning: GitBranch,
  scheduling: Calendar,
  testing: TestTube2,
  preparing: ClipboardCheck,
  managing: Settings2,
  deployment: Rocket,
};

const statusStyles: Record<string, { circle: string; line: string; text: string }> = {
  complete: { circle: "bg-emerald-500 text-white border-emerald-500", line: "bg-emerald-300", text: "text-emerald-700" },
  active: { circle: "bg-brand-500 text-white border-brand-500 ring-4 ring-brand-500/20", line: "bg-brand-300", text: "text-brand-600" },
  pending: { circle: "bg-gray-100 text-gray-400 border-gray-200", line: "bg-gray-200", text: "text-gray-400" },
  blocked: { circle: "bg-error-500 text-white border-error-500", line: "bg-error-200", text: "text-error-600" },
};

export function ReleaseLifecycleStrip({ stages }: { stages: LifecycleStageView[] }) {
  return (
    <AdvancedCard title="Release Lifecycle" variant="glass" innerClassName="p-5 md:p-6 overflow-x-auto">
      <div className="flex items-start min-w-[640px]">
        {stages.map((stage, idx) => {
          const Icon = icons[stage.id] ?? GitBranch;
          const s = statusStyles[stage.status];
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.id} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0 px-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    s.circle,
                    stage.status === "active" && "animate-pulse"
                  )}
                >
                  {stage.status === "complete" ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <p className={cn("mt-2 text-xs font-semibold text-center", s.text)}>{stage.label}</p>
                <p className="mt-1 text-[10px] text-gray-400 text-center leading-tight line-clamp-2">{stage.detail}</p>
              </div>
              {!isLast && (
                <div className={cn("h-0.5 w-full mt-5 min-w-[12px]", s.line, stage.status === "pending" && "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>
    </AdvancedCard>
  );
}
