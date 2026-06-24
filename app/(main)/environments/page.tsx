"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AIPanel } from "@/components/ui/ai-panel";
import { EnvironmentDeskMetrics } from "@/components/environments/EnvironmentDeskMetrics";
import { EnvironmentDeskAlerts } from "@/components/environments/EnvironmentDeskAlerts";
import { ReleaseTimeline } from "@/components/environments/ReleaseTimeline";
import { SystemMappingView } from "@/components/environments/SystemMappingView";
import { EnvBookingTable } from "@/components/environments/EnvBookingTable";
import { VersionMatrix } from "@/components/environments/VersionMatrix";
import { AppEnvConfigTable } from "@/components/environments/AppEnvConfigTable";
import { AppConfigTable } from "@/components/environments/AppConfigTable";
import { callAgent } from "@/lib/agent-client";
import { useOrgContext } from "@/lib/use-org-context";
import type {
  ApplicationConfig,
  ApplicationEnvConfig,
  ApplicationVersionRow,
  EnterpriseSystemNode,
  EnvBooking,
  EnvironmentDeskAlert,
  EnvironmentDeskStats,
  ReleaseTimelineEntry,
} from "@/lib/types";
import type { SessionUser } from "@/lib/auth/roles";

type DeskPayload = {
  versionMatrix: ApplicationVersionRow[];
  timeline: ReleaseTimelineEntry[];
  bookings: EnvBooking[];
  edges: { id: string; sourceApp: { name: string }; sourceEnv: { name: string }; targetApp: { name: string }; targetEnv: { name: string } }[];
  environments: { id: string; name: string; type: string; status: string; application: { name: string } }[];
  applications: { id: string; name: string; type: string; department: { name: string } }[];
  stats: { activeReleases: number; bookedEnvs: number; driftApps: number; mappingEdges: number };
  alerts: EnvironmentDeskAlert[];
};

export default function EnvironmentsPage() {
  const orgContext = useOrgContext();
  const [desk, setDesk] = useState<DeskPayload | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const loadDesk = useCallback(() => {
    fetch("/api/environment-desk").then((r) => r.json()).then(setDesk);
  }, []);

  useEffect(() => {
    loadDesk();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
  }, [loadDesk]);

  useEffect(() => {
    if (!desk) return;
    callAgent({
      agentRole: "Summary Agent",
      context: { ...orgContext, environmentDesk: desk },
    }).then((res) => {
      setAiSummary(res.text ?? null);
      setAiLoading(false);
    });
  }, [orgContext, desk]);

  const stats: EnvironmentDeskStats = useMemo(
    () =>
      desk
        ? {
            timelineCount: desk.timeline.length,
            bookedEnvs: desk.stats.bookedEnvs,
            bookingConflicts: 0,
            versionDrift: desk.stats.driftApps,
            releasesInFreeze: 0,
            unhealthyServices: desk.environments.filter((e) => e.status !== "Available").length,
            activeImpacts: desk.stats.activeReleases,
            mappedServices: desk.stats.mappingEdges,
            promotionGap: desk.stats.driftApps,
          }
        : {
            timelineCount: 0,
            bookedEnvs: 0,
            bookingConflicts: 0,
            versionDrift: 0,
            releasesInFreeze: 0,
            unhealthyServices: 0,
            activeImpacts: 0,
            mappedServices: 0,
            promotionGap: 0,
          },
    [desk]
  );

  const systemNodes: EnterpriseSystemNode[] = useMemo(() => {
    if (!desk) return [];
    const nodes: EnterpriseSystemNode[] = desk.applications.map((a) => ({
      id: `app-${a.id}`,
      label: a.name,
      type: "application",
    }));
    desk.environments.forEach((e) => {
      nodes.push({
        id: e.id,
        label: `${e.application.name} · ${e.name}`,
        type: "environment",
        parentId: `app-${desk.applications.find((a) => a.name === e.application.name)?.id}`,
        status: e.status === "Available" ? "healthy" : "warning",
      });
    });
    return nodes;
  }, [desk]);

  const envConfigs: ApplicationEnvConfig[] = useMemo(
    () =>
      desk?.environments.map((e) => ({
        application: e.application.name,
        environment: e.type.includes("Prod") ? "PROD" : e.type.includes("Test") || e.type.includes("UAT") ? "TEST" : "DEV",
        infra: "Azure AKS",
        firewall: "Standard",
        networkZone: e.status === "Restricted" ? "DMZ" : "Internal",
        lastUpdated: new Date().toISOString(),
      })) ?? [],
    [desk]
  );

  const appConfigs: ApplicationConfig[] = useMemo(
    () =>
      desk?.applications.map((a) => ({
        application: a.name,
        baseUrl: `https://${a.name.toLowerCase()}.internal.example.com`,
        apiUrl: `https://api.${a.name.toLowerCase()}.internal.example.com`,
        featureFlags: [],
        lastUpdated: new Date().toISOString(),
      })) ?? [],
    [desk]
  );

  const canPromote = user?.role === "editor" || user?.role === "admin";

  const promote = async (application: string, fromStage: "dev" | "test" | "prod", toStage: "dev" | "test" | "prod") => {
    await fetch("/api/environment-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationName: application, fromStage, toStage }),
    });
    loadDesk();
  };

  const handleTimelineSelect = (entry: ReleaseTimelineEntry | null) => {
    setSelectedTimelineId(entry?.id ?? null);
    if (entry?.releaseId) setSelectedTimelineId(entry.releaseId);
    if (entry?.department) setSelectedApp(entry.department === "Platform" ? "SAP" : entry.department);
  };

  if (!desk) {
    return <p className="text-gray-500 p-6">Loading environment desk…</p>;
  }

  return (
    <div className="space-y-6">
      <TopBar
        title="Versions & Config"
        subtitle="Live release train, bookings, version promotion, and environment topology from Release Desk database"
        highlight
      />

      <EnvironmentDeskMetrics stats={stats} />
      <EnvironmentDeskAlerts alerts={desk.alerts} />

      <AIPanel title="Environment Desk Briefing" agent="Summary Agent" loading={aiLoading}>
        {aiSummary && <p>{aiSummary}</p>}
      </AIPanel>

      <ReleaseTimeline
        entries={desk.timeline}
        selectedId={selectedTimelineId}
        onSelect={handleTimelineSelect}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SystemMappingView
          nodes={systemNodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(node) => {
            setSelectedNodeId(node?.id ?? null);
            const label = node?.label ?? "";
            if (label.includes("FIN")) setSelectedApp("FIN");
            else if (label.includes("CRM")) setSelectedApp("CRM");
            else if (label.includes("Oracle")) setSelectedApp("Oracle");
            else if (label.includes("SAP")) setSelectedApp("SAP");
          }}
        />
        <EnvBookingTable bookings={desk.bookings} highlightSystem={selectedApp ?? undefined} />
      </div>

      <VersionMatrix
        rows={desk.versionMatrix}
        selectedApp={selectedApp}
        onSelectApp={setSelectedApp}
        onPromote={promote}
        canPromote={canPromote}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AppEnvConfigTable configs={envConfigs} selectedApp={selectedApp} onSelectApp={setSelectedApp} />
        <AppConfigTable configs={appConfigs} selectedApp={selectedApp} onSelectApp={setSelectedApp} />
      </div>
    </div>
  );
}
