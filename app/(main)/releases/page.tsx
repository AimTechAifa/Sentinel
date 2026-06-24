"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { ReleaseFormModal } from "@/components/releases/ReleaseFormModal";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { taBtnPrimary } from "@/lib/styles";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import type { SessionUser } from "@/lib/auth/roles";

type ReleaseRow = {
  id: string;
  releaseCode: string;
  name: string;
  programProject: string | null;
  owner: string;
  status: string;
  releaseDate: string;
  priority: string;
  impact: string;
  departmentId: string;
  department: { name: string };
  applications: { application: { id: string; name: string } }[];
  dependsOn: { dependsOnRelease: { id: string; releaseCode: string; name: string } }[];
};

export default function ReleasesPage() {
  const [rows, setRows] = useState<ReleaseRow[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<ReleaseRow | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [applications, setApplications] = useState<{ id: string; name: string }[]>([]);

  const refresh = () => {
    fetch("/api/releases").then((r) => r.json()).then(setRows);
  };

  useEffect(() => {
    refresh();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    fetch("/api/departments").then((r) => r.json()).then(setDepartments);
    fetch("/api/applications").then((r) => r.json()).then(setApplications);
  }, []);

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const remove = async (id: string) => {
    if (!confirm("Delete this release?")) return;
    await fetch(`/api/releases/${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div>
      <TopBar title="Releases" subtitle={`${rows.length} releases — click a row to open detail`} highlight />
      <DataTable
        title="All Releases"
        subtitle="Release ID, program, priority, impact, department, applications"
        icon={Package}
        action={
          canEdit ? (
            <button type="button" className={cn(taBtnPrimary, "text-xs py-1.5 px-2.5")} onClick={() => { setEditRow(null); setModalOpen(true); }}>
              <Plus className="h-3.5 w-3.5 inline mr-1" /> New release
            </button>
          ) : undefined
        }
      >
        <table className="w-full text-sm">
          <thead className={tableHeadRow}>
            <tr>
              <th className={`${tableCell} text-left font-medium`}>Release ID</th>
              <th className={`${tableCell} text-left font-medium`}>Name</th>
              <th className={`${tableCell} text-left font-medium`}>Program / Project</th>
              <th className={`${tableCell} text-left font-medium`}>Owner</th>
              <th className={`${tableCell} text-left font-medium`}>Status</th>
              <th className={`${tableCell} text-left font-medium`}>Release date</th>
              <th className={`${tableCell} text-left font-medium`}>Priority</th>
              <th className={`${tableCell} text-left font-medium`}>Impact</th>
              <th className={`${tableCell} text-left font-medium`}>Department</th>
              <th className={`${tableCell} text-left font-medium`}>Applications</th>
              <th className={`${tableCell} text-left font-medium`}>Depends on</th>
              {canEdit && <th className={`${tableCell} text-left font-medium`} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={cn(tableRow, "group")}>
                <td className={tableCell}>
                  <ProgressLink href={`/releases/${r.id}`} className="font-mono text-xs text-brand-600 hover:underline">
                    {r.releaseCode}
                  </ProgressLink>
                </td>
                <td className={tableCell}>
                  <ProgressLink href={`/releases/${r.id}`} className="hover:text-brand-600">{r.name}</ProgressLink>
                </td>
                <td className={`${tableCell} text-gray-600`}>{r.programProject ?? "N/A"}</td>
                <td className={`${tableCell} text-gray-600`}>{r.owner}</td>
                <td className={tableCell}><StatusBadge status={r.status as "Ready"} /></td>
                <td className={`${tableCell} text-gray-500`}>{formatDate(r.releaseDate)}</td>
                <td className={tableCell}>{r.priority}</td>
                <td className={tableCell}>{r.impact}</td>
                <td className={tableCell}>{r.department.name}</td>
                <td className={`${tableCell} text-xs text-gray-600`}>
                  {r.applications.map((a) => a.application.name).join(", ") || "—"}
                </td>
                <td className={`${tableCell} text-xs text-gray-600`}>
                  {r.dependsOn.map((d) => d.dependsOnRelease.releaseCode).join(", ") || "—"}
                </td>
                {canEdit && (
                  <td className={tableCell}>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => { setEditRow(r); setModalOpen(true); }} className="text-gray-500"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => remove(r.id)} className="text-error-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      <ReleaseFormModal
        open={modalOpen}
        initial={editRow ? {
          id: editRow.id,
          releaseCode: editRow.releaseCode,
          name: editRow.name,
          programProject: editRow.programProject ?? "",
          owner: editRow.owner,
          status: editRow.status,
          releaseDate: editRow.releaseDate,
          priority: editRow.priority,
          impact: editRow.impact,
          departmentId: editRow.departmentId,
          applicationIds: editRow.applications.map((a) => a.application.id),
          dependsOnReleaseIds: editRow.dependsOn.map((d) => d.dependsOnRelease.id),
          notes: "",
        } : undefined}
        departments={departments.map((d) => ({ value: d.id, label: d.name }))}
        applications={applications.map((a) => ({ value: a.id, label: a.name }))}
        releases={rows.map((r) => ({ value: r.id, label: r.releaseCode }))}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
      />
    </div>
  );
}
