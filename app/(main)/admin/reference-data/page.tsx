"use client";

import { TopBar } from "@/components/layout/TopBar";
import { ReferenceDataTable, useReferenceData } from "@/components/admin/ReferenceDataTable";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils";

type Dept = { id: string; name: string; head: string };
type App = { id: string; name: string; departmentId: string; type: string; productOwner: string; techLead: string; support: string; criticality: string; department: { name: string } };
type Env = { id: string; applicationId: string; name: string; type: string; owner: string; lastDbRefresh: string | null; status: string; application: { name: string } };

export default function AdminReferenceDataPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const depts = useReferenceData<Dept>("/api/departments");
  const apps = useReferenceData<App>("/api/applications");
  const envs = useReferenceData<Env>("/api/environments");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  const canEdit = user?.role === "admin" || user?.role === "editor";
  const deptOptions = depts.rows.map((d) => ({ value: d.id, label: d.name }));
  const appOptions = apps.rows.map((a) => ({ value: a.id, label: a.name }));

  return (
    <div className="space-y-6">
      <TopBar
        title="Setup / Configuration / Reference Data"
        subtitle="Manage departments, applications, and environments — all dropdowns across Release Desk read from here"
        highlight
      />

      {!canEdit && user && (
        <p className="text-sm text-gray-500 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
          Read-only access. Sign in as Editor or Admin to add, edit, or import reference data.
        </p>
      )}

      <ReferenceDataTable
        title="Departments"
        subtitle="name, head"
        apiPath="/api/departments"
        importEntity="departments"
        canEdit={canEdit}
        rows={depts.rows}
        onRefresh={depts.refresh}
        createEmpty={() => ({ name: "", head: "" })}
        columns={[
          { key: "name", label: "Name" },
          { key: "head", label: "Head" },
        ]}
      />

      <ReferenceDataTable
        title="Applications"
        subtitle="Linked to department"
        apiPath="/api/applications"
        importEntity="applications"
        canEdit={canEdit}
        rows={apps.rows}
        onRefresh={apps.refresh}
        createEmpty={() => ({ name: "", departmentId: "", type: "", productOwner: "", techLead: "", support: "", criticality: "Medium" })}
        columns={[
          { key: "name", label: "Name" },
          {
            key: "departmentId",
            label: "Department",
            type: "select",
            options: deptOptions,
            display: (row) => row.department?.name ?? "",
          },
          { key: "type", label: "Type" },
          { key: "productOwner", label: "Product owner" },
          { key: "techLead", label: "Tech lead" },
          { key: "support", label: "Support" },
          { key: "criticality", label: "Criticality" },
        ]}
      />

      <ReferenceDataTable
        title="Environments"
        subtitle="Per application"
        apiPath="/api/environments"
        importEntity="environments"
        canEdit={canEdit}
        rows={envs.rows}
        onRefresh={envs.refresh}
        createEmpty={() => ({ applicationId: "", name: "", type: "Dev", owner: "", lastDbRefresh: "", status: "Available" })}
        columns={[
          {
            key: "applicationId",
            label: "Application",
            type: "select",
            options: appOptions,
            display: (row) => row.application?.name ?? "",
          },
          { key: "name", label: "Name" },
          { key: "type", label: "Type" },
          { key: "owner", label: "Owner" },
          {
            key: "lastDbRefresh",
            label: "Last DB refresh",
            type: "date",
            display: (row) => (row.lastDbRefresh ? formatDate(row.lastDbRefresh) : "—"),
          },
          { key: "status", label: "Status" },
        ]}
      />
    </div>
  );
}
