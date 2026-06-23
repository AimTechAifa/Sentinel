"use client";

import { TopBar } from "@/components/layout/TopBar";
import { ReleaseTimeline } from "@/components/environments/ReleaseTimeline";
import { SystemMappingView } from "@/components/environments/SystemMappingView";
import { EnvBookingTable } from "@/components/environments/EnvBookingTable";
import { VersionMatrix } from "@/components/environments/VersionMatrix";
import { AppEnvConfigTable } from "@/components/environments/AppEnvConfigTable";
import { AppConfigTable } from "@/components/environments/AppConfigTable";
import { EnterpriseReleaseImpactPanel } from "@/components/environments/EnterpriseReleaseImpactPanel";
import {
  applicationConfigs,
  applicationEnvConfigs,
  applicationVersions,
  enterpriseReleaseImpacts,
  enterpriseSystemNodes,
  envBookings,
  releaseTimeline,
} from "@/lib/enterprise-env-data";

export default function EnvironmentsPage() {
  return (
    <div className="space-y-6">
      <TopBar
        title="Environment Desk"
        subtitle="Release timeline, environment booking, system mapping, version matrix, and application configuration"
        highlight
      />

      <ReleaseTimeline entries={releaseTimeline} />

      <div className="grid gap-6 xl:grid-cols-2">
        <SystemMappingView nodes={enterpriseSystemNodes} />
        <EnvBookingTable bookings={envBookings} />
      </div>

      <VersionMatrix rows={applicationVersions} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AppEnvConfigTable configs={applicationEnvConfigs} />
        <AppConfigTable configs={applicationConfigs} />
      </div>

      <EnterpriseReleaseImpactPanel impacts={enterpriseReleaseImpacts} />
    </div>
  );
}
