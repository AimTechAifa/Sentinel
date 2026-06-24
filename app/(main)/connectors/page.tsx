"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { MetricCard } from "@/components/ui/metric-card";
import { connectors } from "@/lib/dummy-data";
import { connectorSlug } from "@/lib/connectors";
import type { ConnectorCategory } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { taBtnSecondary } from "@/lib/styles";
import { Plug, Link2, Unlink, AlertCircle, RefreshCw } from "lucide-react";
import type { SessionUser } from "@/lib/auth/roles";

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
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const [liveSync, setLiveSync] = useState<{ name: string; lastSynced: string }[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/connectors").then((r) => r.json()).then(setLiveSync);
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  const syncNow = async (name: string) => {
    setSyncing(name);
    const res = await fetch("/api/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const row = await res.json();
      setLiveSync((prev) => prev.map((c) => (c.name === name ? row : c)));
    }
    setSyncing(null);
  };

  const canSync = user?.role === "editor" || user?.role === "admin";

  const filteredConnectors = useMemo(() => {
    if (filter === "issues") {
      return connectors.filter((c) => c.status === "Error" || c.status === "Disconnected");
    }
    return connectors;
  }, [filter]);

  const connected = connectors.filter((c) => c.status === "Connected").length;
  const errors = connectors.filter((c) => c.status === "Error").length;
  const disconnected = connectors.filter((c) => c.status === "Disconnected").length;

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    items: filteredConnectors.filter((c) => c.category === category),
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
        subtitle={
          filter === "issues"
            ? "Showing integrations with sync errors or disconnected status"
            : `${connectors.length} integrations across your DevOps toolchain`
        }
        highlight
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6 mb-8">
        {metrics.map(({ label, value, icon: Icon }, i) => (
          <div key={label} className="col-span-6 sm:col-span-3">
            <MetricCard label={label} value={value} icon={Icon} delay={i * 0.06} />
          </div>
        ))}
      </div>

      {liveSync.length > 0 && (
        <AdvancedCard title="Release Desk integrations" subtitle="Live sync status — same sources shown on Dashboard" variant="glass" className="mb-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {liveSync.map((c) => (
              <div key={c.name} className="rounded-xl border border-gray-100 bg-white/80 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{c.name}</span>
                  <StatusBadge status="Connected" />
                </div>
                <p className="text-xs text-gray-500">Last synced: {formatDateTime(c.lastSynced)}</p>
                {canSync && (
                  <button type="button" className={taBtnSecondary + " text-xs !py-1.5"} onClick={() => syncNow(c.name)} disabled={syncing === c.name}>
                    <RefreshCw className={`h-3.5 w-3.5 inline mr-1 ${syncing === c.name ? "animate-spin" : ""}`} />
                    {syncing === c.name ? "Syncing…" : "Sync now"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </AdvancedCard>
      )}

      <div className="space-y-8">
        {byCategory.map(({ category, items }) => (
          <section key={category}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((c) => (
                <div key={c.id} id={connectorSlug(c.name)} className="scroll-mt-24 h-full">
                <AdvancedCard variant="glass" className="h-full">
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
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
