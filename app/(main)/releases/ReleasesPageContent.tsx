"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { SourceBadgeInline } from "@/components/dashboard/UnifiedPortfolioPanel";
import { ReleaseFormModal } from "@/components/releases/ReleaseFormModal";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { releases as demoReleases } from "@/lib/dummy-data";
import {
  dbReleaseMatchesFilters,
  filterLabel,
} from "@/lib/release-filters";
import {
  dbToUnified,
  demoReleaseMatchesFilters,
  demoToUnified,
  mergeReleases,
  type UnifiedRelease,
} from "@/lib/unified-releases";
import { formatDate, cn } from "@/lib/utils";
import { taBtnPrimary } from "@/lib/styles";
import type { SessionUser } from "@/lib/auth/roles";

type ViewFilter = "all" | "database" | "demo";

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

export default function ReleasesPageContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as ViewFilter) || "all";

  const {
    filters,
    hasRefinement,
    departments,
    applications,
    environments,
    bookings,
    dbRows,
    refreshLookups,
  } = useReleaseFilters();

  const [view, setView] = useState<ViewFilter>(initialView);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<ReleaseRow | null>(null);

  useEffect(() => {
    setView((searchParams.get("view") as ViewFilter) || "all");
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  const unified = useMemo(() => {
    const filteredDb = (dbRows as ReleaseRow[]).filter((r) =>
      dbReleaseMatchesFilters(r, filters, bookings, environments)
    );
    const filteredDemo = demoReleases.filter((r) =>
      demoReleaseMatchesFilters(r, filters, departments, applications, environments)
    );

    const db = filteredDb.map((r) => dbToUnified(r));
    const demo = filteredDemo.map(demoToUnified);
    const merged = mergeReleases(db, demo);

    if (view === "database") return merged.filter((r) => r.source === "database");
    if (view === "demo") return merged.filter((r) => r.source === "demo");
    return merged;
  }, [dbRows, view, filters, bookings, environments, departments, applications]);

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const refresh = () => refreshLookups();

  const remove = async (id: string) => {
    if (!confirm("Delete this release?")) return;
    await fetch(`/api/releases/${id}`, { method: "DELETE" });
    refreshLookups();
  };

  const dbRowById = (id: string) => (dbRows as ReleaseRow[]).find((r) => r.id === id);

  return (
    <div>
      <TopBar
        title="Releases"
        subtitle={
          hasRefinement
            ? `${unified.length} releases · ${scopeLabel}`
            : `${unified.length} releases — database MVP and demo command center`
        }
        highlight
      />

      <div className="flex flex-wrap gap-2 mb-3">
        {(["all", "database", "demo"] as ViewFilter[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize border transition-colors",
              view === v ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 text-gray-600 hover:border-brand-300"
            )}
          >
            {v === "all" ? "All sources" : v}
          </button>
        ))}
      </div>

      <ReleaseFiltersBar className="mb-4" />

      <DataTable
        title="All Releases"
        subtitle="DB rows are editable; demo rows open the synthetic command center"
        icon={Package}
        action={
          canEdit ? (
            <button type="button" className={cn(taBtnPrimary, "text-xs py-1.5 px-2.5")} onClick={() => { setEditRow(null); setModalOpen(true); }}>
              <Plus className="h-3.5 w-3.5 inline mr-1" /> New release (DB)
            </button>
          ) : undefined
        }
      >
        <table className="w-full text-sm">
          <thead className={tableHeadRow}>
            <tr>
              <th className={`${tableCell} text-left font-medium`}>Source</th>
              <th className={`${tableCell} text-left font-medium`}>Release ID</th>
              <th className={`${tableCell} text-left font-medium`}>Name</th>
              <th className={`${tableCell} text-left font-medium`}>Owner</th>
              <th className={`${tableCell} text-left font-medium`}>Status</th>
              <th className={`${tableCell} text-left font-medium`}>Release date</th>
              <th className={`${tableCell} text-left font-medium`}>Group</th>
              {hasRefinement && (
                <th className={`${tableCell} text-left font-medium`}>Applications</th>
              )}
              {canEdit && <th className={`${tableCell} text-left font-medium`} />}
            </tr>
          </thead>
          <tbody>
            {unified.length === 0 ? (
              <tr>
                <td colSpan={hasRefinement ? (canEdit ? 9 : 8) : canEdit ? 8 : 7} className={`${tableCell} text-center text-gray-400 py-8`}>
                  No releases match the current filters.
                </td>
              </tr>
            ) : (
              unified.map((r) => (
                <UnifiedRow
                  key={`${r.source}-${r.id}`}
                  row={r}
                  dbRow={dbRowById(r.id)}
                  showApps={hasRefinement}
                  canEdit={canEdit}
                  onEdit={() => {
                    const db = dbRowById(r.id);
                    if (db) { setEditRow(db); setModalOpen(true); }
                  }}
                  onDelete={() => remove(r.id)}
                />
              ))
            )}
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
        releases={(dbRows as ReleaseRow[]).map((r) => ({ value: r.id, label: r.releaseCode }))}
        onClose={() => setModalOpen(false)}
        onSaved={refreshLookups}
      />
    </div>
  );
}

function UnifiedRow({
  row,
  dbRow,
  showApps,
  canEdit,
  onEdit,
  onDelete,
}: {
  row: UnifiedRelease;
  dbRow?: ReleaseRow;
  showApps: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const appLabel =
    row.source === "database" && dbRow
      ? dbRow.applications.map((a) => a.application.name).join(", ") || "—"
      : row.source === "demo"
        ? row.group
        : "—";

  return (
    <tr className={cn(tableRow, "group")}>
      <td className={tableCell}><SourceBadgeInline source={row.source} /></td>
      <td className={tableCell}>
        <ProgressLink href={row.href} className="font-mono text-xs text-brand-600 hover:underline">{row.code}</ProgressLink>
      </td>
      <td className={tableCell}>
        <ProgressLink href={row.href} className="hover:text-brand-600">{row.name}</ProgressLink>
      </td>
      <td className={`${tableCell} text-gray-600`}>{row.owner}</td>
      <td className={tableCell}><StatusBadge status={row.status as "Ready"} /></td>
      <td className={`${tableCell} text-gray-500`}>{formatDate(row.date)}</td>
      <td className={tableCell}>{row.group}</td>
      {showApps && (
        <td className={`${tableCell} text-xs text-gray-500`}>{appLabel}</td>
      )}
      {canEdit && (
        <td className={tableCell}>
          {row.source === "database" ? (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={onEdit} className="text-gray-500"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={onDelete} className="text-error-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ) : (
            <span className="text-[10px] text-violet-600">Demo only</span>
          )}
        </td>
      )}
    </tr>
  );
}
