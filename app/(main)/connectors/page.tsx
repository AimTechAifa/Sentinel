"use client";

import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { MetricCard } from "@/components/ui/metric-card";
import { connectors } from "@/lib/dummy-data";
import type { ConnectorCategory } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Plug, Link2, Unlink, AlertCircle } from "lucide-react";

const CATEGORY_ORDER: ConnectorCategory[] = [
  "Issue Tracking",
  "Source Control",
  "CI/CD",
  "Change Management",
  "Monitoring",
  "Incident",
  "Security",
  "Documentation",
  "Communication",
  "Deployment",
  "Artifact Registry",
  "Feature Flags",
  "Secrets & Config",
];

const statusDot: Record<string, string> = {
  Connected: "bg-emerald-500 shadow-[0_0_8px_rgba(18,183,106,0.5)]",
  Disconnected: "bg-gray-400",
  Error: "bg-error-500 shadow-[0_0_8px_rgba(240,68,56,0.5)]",
};

export default function ConnectorsPage() {
  const connected = connectors.filter((c) => c.status === "Connected").length;
  const errors = connectors.filter((c) => c.status === "Error").length;
  const disconnected = connectors.filter((c) => c.status === "Disconnected").length;

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    items: connectors.filter((c) => c.category === category),
  })).filter((g) => g.items.length > 0);

  const metrics = [
    { label: "Total integrations", value: connectors.length, icon: Plug },
    { label: "Connected", value: connected, icon: Link2 },
    { label: "Errors", value: errors, icon: AlertCircle },
    { label: "Disconnected", value: disconnected, icon: Unlink },
  ];

  return (
    <div>
      <TopBar
        title="Connectors"
        subtitle={`${connectors.length} integrations across your DevOps toolchain`}
        highlight
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6 mb-8">
        {metrics.map(({ label, value, icon: Icon }, i) => (
          <div key={label} className="col-span-6 sm:col-span-3">
            <MetricCard label={label} value={value} icon={Icon} delay={i * 0.06} />
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {byCategory.map(({ category, items }) => (
          <section key={category}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((c) => (
                <AdvancedCard key={c.id} variant="glass" className="h-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{c.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusDot[c.status]}`} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{c.description}</p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>
                      Token: <code className="bg-slate-100 px-1 rounded">{c.maskedToken}</code>
                    </p>
                    <p>Last synced: {formatDateTime(c.lastSynced)}</p>
                  </div>
                </AdvancedCard>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
