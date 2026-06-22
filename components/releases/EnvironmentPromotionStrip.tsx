"use client";

import { Globe } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { buildEnvironmentPromotions } from "@/lib/environment-promotions";
import type { DeploymentPhase, Release } from "@/lib/types";
import { cn } from "@/lib/utils";

const ENV_LABELS = { dev: "Dev", staging: "Staging", prod: "Prod" } as const;
const ENV_ORDER = ["dev", "staging", "prod"] as const;

const statusStyles: Record<string, string> = {
  live: "bg-success-50 text-success-700 border-success-200",
  deploying: "bg-brand-50 text-brand-700 border-brand-200 ring-2 ring-brand-200/50",
  pending: "bg-gray-50 text-gray-500 border-gray-200",
  failed: "bg-error-50 text-error-700 border-error-200",
  "rolled-back": "bg-orange-50 text-orange-700 border-orange-200",
};

export function EnvironmentPromotionStrip({
  release,
  deployPhase,
}: {
  release: Release;
  deployPhase?: DeploymentPhase;
}) {
  const promotions = buildEnvironmentPromotions(release, deployPhase);
  const regions = Array.from(new Set(promotions.map((p) => p.region)));

  return (
    <AdvancedCard
      title="Environment & Region Promotion"
      subtitle="Version across Dev → Staging → Prod per region"
      icon={Globe}
      variant="glass"
    >
      <div className="space-y-4">
        {regions.map((region) => {
          const row = promotions.filter((p) => p.region === region);
          return (
            <div key={region}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{region}</p>
              <div className="flex flex-wrap gap-2">
                {ENV_ORDER.map((env) => {
                  const promo = row.find((p) => p.environment === env);
                  if (!promo) return null;
                  return (
                    <div
                      key={`${region}-${env}`}
                      className={cn(
                        "flex flex-col rounded-xl border px-3 py-2 min-w-[100px] transition-all",
                        statusStyles[promo.status]
                      )}
                    >
                      <span className="text-[10px] font-medium opacity-70">{ENV_LABELS[env]}</span>
                      <span className="text-sm font-bold tabular-nums">{promo.version}</span>
                      <span className="text-[10px] capitalize mt-0.5 opacity-80">
                        {promo.status === "deploying" ? "Deploying…" : promo.status.replace("-", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AdvancedCard>
  );
}
