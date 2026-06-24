"use client";

import { useCallback, useEffect, useState } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { DbReleaseCommandCenter } from "@/components/releases/DbReleaseCommandCenter";
import { StakeholderCommsPanel } from "@/components/releases/StakeholderCommsPanel";
import { ReleaseFormModal } from "@/components/releases/ReleaseFormModal";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { taBtnPrimary, taBtnSecondary, taInput } from "@/lib/styles";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/roles";
import { CalendarCheck, GitBranch, History, Network, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ReleaseDetail = {
  id: string;
  releaseCode: string;
  name: string;
  programProject: string | null;
  owner: string;
  status: string;
  releaseDate: string;
  priority: string;
  impact: string;
  notes: string | null;
  decision: string | null;
  departmentId: string;
  department: { name: string };
  applications: { application: { id: string; name: string } }[];
  dependsOn: { dependsOnRelease: { id: string; releaseCode: string; name: string } }[];
  bookings: { id: string; purpose: string | null; fromDate: string; toDate: string; application: { name: string } }[];
  auditEvents: { id: string; action: string; actor: string; detail: string | null; createdAt: string }[];
};

const STATUSES = ["Planned", "In Progress", "Blocked", "At Risk", "Complete"];

export function DbReleaseDetail({ id }: { id: string }) {
  const router = useRouter();
  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState("");
  const [lookups, setLookups] = useState<{ departments: { id: string; name: string }[]; applications: { id: string; name: string }[]; releases: { id: string; releaseCode: string }[] }>({ departments: [], applications: [], releases: [] });

  const load = useCallback(() => {
    fetch(`/api/releases/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setRelease(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    Promise.all([
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
      fetch("/api/releases").then((r) => r.json()),
    ]).then(([departments, applications, releases]) => setLookups({ departments, applications, releases }));
  }, []);

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const patchStatus = async (status: string) => {
    await fetch(`/api/releases/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };

  const recordDecision = async (detail: string) => {
    await fetch(`/api/releases/${id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decision", detail }),
    });
    load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await fetch(`/api/releases/${id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "note", detail: note }),
    });
    setNote("");
    load();
  };

  const remove = async () => {
    if (!confirm("Delete this release?")) return;
    await fetch(`/api/releases/${id}`, { method: "DELETE" });
    router.push("/releases");
  };

  if (loading) return <p className="text-gray-500">Loading release…</p>;
  if (!release) return <p className="text-gray-500">Release not found.</p>;

  return (
    <div className="space-y-6">
      <TopBar
        title={`${release.releaseCode} — ${release.name}`}
        subtitle={`${release.department.name} · Owner: ${release.owner} · Target: ${formatDate(release.releaseDate)}`}
        highlight
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={release.status as "Ready"} />
        {release.decision && <StatusBadge status={release.decision as "Approved"} />}
        <div className="ml-auto flex flex-wrap gap-2">
          <ProgressLink href={`/releases/${id}/dependencies`} className={taBtnSecondary + " text-sm !py-2"}>
            <Network className="h-4 w-4 inline mr-1" /> Dependencies
          </ProgressLink>
          <ProgressLink href="/booking" className={taBtnSecondary + " text-sm !py-2"}>
            <CalendarCheck className="h-4 w-4 inline mr-1" /> Book env
          </ProgressLink>
          <ProgressLink href="/system-mapping" className={taBtnSecondary + " text-sm !py-2"}>
            <GitBranch className="h-4 w-4 inline mr-1" /> Mapping
          </ProgressLink>
          {canEdit && (
            <>
              <button type="button" className={taBtnSecondary + " text-sm !py-2"} onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 inline mr-1" /> Edit
              </button>
              <button type="button" className="text-sm text-error-600 px-3 py-2" onClick={remove}>
                <Trash2 className="h-4 w-4 inline" />
              </button>
            </>
          )}
        </div>
      </div>

      <DbReleaseCommandCenter releaseId={id} />

      <StakeholderCommsPanel releaseId={id} releaseCode={release.releaseCode} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
        <AdvancedCard title="Release details">
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <Item label="Program / Project" value={release.programProject ?? "N/A"} />
            <Item label="Priority / Impact" value={`${release.priority} / ${release.impact}`} />
            <Item label="Applications" value={release.applications.map((a) => a.application.name).join(", ") || "—"} />
            <Item label="Depends on" value={release.dependsOn.map((d) => d.dependsOnRelease.releaseCode).join(", ") || "—"} />
          </dl>
          {canEdit && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 w-full">Quick status</span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => patchStatus(s)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs border transition-colors",
                    release.status === s ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 hover:border-brand-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {release.notes && <p className="mt-4 text-sm text-gray-600 border-t pt-3">{release.notes}</p>}
        </AdvancedCard>
        </div>

        <div id="go-nogo">
          <AdvancedCard title="Go / No-Go" subtitle="Recorded to audit trail">
            {canEdit ? (
              <div className="flex gap-2">
                <button type="button" className={taBtnPrimary + " flex-1 !bg-success-600"} onClick={() => recordDecision("Go — approved for deployment")}>Go</button>
                <button type="button" className={taBtnPrimary + " flex-1 !bg-error-600"} onClick={() => recordDecision("No-Go — blocked")}>No-Go</button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{release.decision ?? "No decision recorded"}</p>
            )}
          </AdvancedCard>
        </div>
      </div>

      {release.bookings.length > 0 && (
        <AdvancedCard title="Linked environment bookings">
          <ul className="space-y-2 text-sm">
            {release.bookings.map((b) => (
              <li key={b.id} className="text-gray-700">
                <strong>{b.application.name}</strong> · {formatDate(b.fromDate)} → {formatDate(b.toDate)}
                {b.purpose && <span className="text-gray-500"> · {b.purpose}</span>}
              </li>
            ))}
          </ul>
        </AdvancedCard>
      )}

      <AdvancedCard title="Audit trail" icon={History}>
        <div className="space-y-3">
          {canEdit && (
            <div className="flex gap-2">
              <input className={taInput} placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button type="button" className={taBtnSecondary} onClick={addNote}>Add</button>
            </div>
          )}
          {release.auditEvents.map((e) => (
            <div key={e.id} className="text-sm border-b border-gray-100 pb-2">
              <span className="text-xs text-gray-400">{formatDateTime(e.createdAt)} · {e.actor}</span>
              <p className="text-gray-700 capitalize">{e.action.replace("_", " ")}{e.detail ? ` — ${e.detail}` : ""}</p>
            </div>
          ))}
        </div>
      </AdvancedCard>

      <ReleaseFormModal
        open={editOpen}
        initial={{
          id: release.id,
          releaseCode: release.releaseCode,
          name: release.name,
          programProject: release.programProject ?? "",
          owner: release.owner,
          status: release.status,
          releaseDate: release.releaseDate,
          priority: release.priority,
          impact: release.impact,
          departmentId: release.departmentId,
          applicationIds: release.applications.map((a) => a.application.id),
          dependsOnReleaseIds: release.dependsOn.map((d) => d.dependsOnRelease.id),
          notes: release.notes ?? "",
        }}
        departments={lookups.departments.map((d) => ({ value: d.id, label: d.name }))}
        applications={lookups.applications.map((a) => ({ value: a.id, label: a.name }))}
        releases={lookups.releases.map((r) => ({ value: r.id, label: r.releaseCode }))}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}
