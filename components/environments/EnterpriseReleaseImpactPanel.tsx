"use client";

import { AlertOctagon } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { EnterpriseReleaseImpact } from "@/lib/types";
import { cn } from "@/lib/utils";

const conditionIcons: Record<string, string> = {
  "queues paused": "⏸",
  "events paused": "📡",
  "DB freezes": "🗄",
  "apps down": "⛔",
  "customer support down": "🎧",
};

export function EnterpriseReleaseImpactPanel({ impacts }: { impacts: EnterpriseReleaseImpact[] }) {
  return (
    <AdvancedCard
      title="Enterprise Release Impact"
      subtitle="Release prerequisites, dependencies, and operational impact conditions"
      icon={AlertOctagon}
      variant="ai"
    >
      <div className="space-y-4">
        {impacts.map((impact) => (
          <div
            key={impact.releaseId}
            className={cn(
              "rounded-xl border p-4 transition-all",
              impact.active ? "border-brand-300 bg-brand-50/50 ring-1 ring-brand-200" : "border-gray-100 bg-white/60"
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="font-semibold text-gray-800">{impact.releaseName}</h4>
              {impact.active && (
                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Active window
                </span>
              )}
            </div>

            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Release prereqs / dependencies
              </p>
              <ul className="space-y-1">
                {impact.prerequisites.map((p) => (
                  <li key={p} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-brand-400 mt-0.5">→</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Impact / conditions
              </p>
              <div className="flex flex-wrap gap-2">
                {impact.conditions.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700"
                  >
                    <span>{conditionIcons[c] ?? "•"}</span>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdvancedCard>
  );
}
