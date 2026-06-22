"use client";

import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { BlockerList } from "@/components/releases/BlockerList";
import { ApprovalChecklist } from "@/components/releases/ApprovalChecklist";
import { AIRiskPanel } from "@/components/releases/AIRiskPanel";
import { BuildExplainer } from "@/components/releases/BuildExplainer";
import { ApprovalNudge } from "@/components/releases/ApprovalNudge";
import { CabPanel } from "@/components/releases/CabPanel";
import { GoNoGoControls } from "@/components/releases/GoNoGoControls";
import { useReleaseStore } from "@/context/ReleaseStoreContext";
import { releases } from "@/lib/dummy-data";
import { formatDate, formatDateTime } from "@/lib/utils";
import { GitBranch, Network } from "lucide-react";

export default function ReleaseDetailPage({ params }: { params: { id: string } }) {
  const release = releases.find((r) => r.id === params.id);
  const { getReleaseDecision, getReleaseHistory } = useReleaseStore();
  const stored = release ? getReleaseDecision(release.id) : null;
  const decision = stored?.decision ?? release?.decision ?? null;
  const history = release ? getReleaseHistory(release.id, release.history) : [];

  if (!release) {
    return <div className="text-slate-500">Release not found.</div>;
  }

  return (
    <div>
      <TopBar title={`${release.version} — ${release.name}`} subtitle={`${release.team} · Owner: ${release.owner} · Target: ${formatDate(release.targetDate)}`} />

      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={release.status} />
        {decision && <StatusBadge status={decision} />}
        <ProgressLink href={`/releases/${release.id}/dependencies`} className="ml-auto flex items-center gap-1.5 text-sm text-primary hover:text-blue-700 font-medium">
          <Network className="w-4 h-4" /> Dependency Map
        </ProgressLink>
      </div>

      <ApprovalNudge release={release} />
      <div className="mt-6">
        <CabPanel release={release} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GoNoGoControls release={release} />
            <BlockerList release={release} />
          </div>

          <AIRiskPanel release={release} />
          <BuildExplainer release={release} />
          <ApprovalChecklist release={release} />

          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Linked Tickets</h3>
            <div className="space-y-2">
              {release.tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div><span className="text-xs text-slate-400">{t.id}</span><p className="text-sm text-slate-700">{t.title}</p></div>
                  <StatusBadge status={t.status === "Done" ? "Approved" : t.status === "Blocked" ? "Blocked" : "Pending"} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Build Status</h3>
            <div className="flex items-center gap-4">
              <StatusBadge status={release.build.status} />
              <span className="text-sm text-slate-600">Build #{release.build.id} · {release.build.pipeline}</span>
              <span className="text-sm text-slate-400">{formatDateTime(release.build.lastRun)}</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">{release.build.passedTests}/{release.build.testCount} tests passed</p>
          </div>

          {release.notes && (
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600">{release.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><GitBranch className="w-4 h-4" /> Commits</h3>
            {release.commits.map((c) => (
              <div key={c.sha} className="py-2 border-b border-slate-50 last:border-0">
                <code className="text-xs bg-slate-100 px-1 rounded">{c.sha}</code>
                <p className="text-sm text-slate-700 mt-1">{c.message}</p>
                <p className="text-xs text-slate-400">{c.author} · {formatDateTime(c.timestamp)}</p>
              </div>
            ))}
            <p className="text-xs text-slate-400 mt-3">{release.filesChanged} files changed</p>
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-3">History</h3>
            {history.map((h) => (
              <div key={h.id} className="py-2 border-b border-slate-50 last:border-0 text-sm">
                <p className="text-slate-700">{h.action}</p>
                <p className="text-xs text-slate-400">{h.actor} · {formatDateTime(h.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
