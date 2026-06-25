"use client";

import { ReferenceDataTable, useReferenceData } from "@/components/admin/ReferenceDataTable";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils";
import { Building2, LayoutGrid, Server, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Dept = { id: string; name: string; head: string };
type App = { id: string; name: string; departmentId: string; type: string; productOwner: string; techLead: string; support: string; criticality: string; department: { name: string } };
type Env = { id: string; applicationId: string; name: string; type: string; owner: string; lastDbRefresh: string | null; status: string; application: { name: string } };

type Tab = "departments" | "applications" | "environments";

export default function AdminReferenceDataPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("departments");

  const depts = useReferenceData<Dept>("/api/departments");
  const apps = useReferenceData<App>("/api/applications");
  const envs = useReferenceData<Env>("/api/environments");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
  }, []);

  const canEdit = user?.role === "admin" || user?.role === "editor";
  const deptOptions = depts.rows.map((d) => ({ value: d.id, label: d.name }));
  const appOptions = apps.rows.map((a) => ({ value: a.id, label: a.name }));

  const tabs = [
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "applications", label: "Applications", icon: LayoutGrid },
    { id: "environments", label: "Environments", icon: Server },
  ];

  return (
    <div className="max-w-[1200px] font-sans pb-24">
      {/* Header Section */}
      <div className="mb-8 mt-2">
        <div className="flex items-center text-[13px] text-gray-500 font-medium mb-3">
          <span className="hover:text-gray-800 cursor-pointer">Admin</span>
          <ChevronRight className="h-3 w-3 mx-1.5" />
          <span className="text-[#2548C9] font-semibold">Reference Data</span>
        </div>
        
        <div className="max-w-[700px]">
          <h1 className="text-[32px] font-bold text-[#111827] tracking-tight mb-2">Reference Data</h1>
          <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
            Manage departments, applications, and environments — all dropdowns across Release Manager read from here.
          </p>
        </div>
      </div>

      {!canEdit && user && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[14px] font-bold text-amber-900">Read-only mode</h4>
            <p className="text-[13px] text-amber-700 mt-1">
              You do not have permission to modify reference data. Please sign in as an Editor or Admin to add, edit, or import records.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8 flex gap-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 pb-4 text-[14px] font-semibold transition-all border-b-2",
                isActive
                  ? "border-[#2548C9] text-[#2548C9]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "departments" && (
          <ReferenceDataTable
            title="Departments"
            subtitle="Name, head"
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
        )}

        {activeTab === "applications" && (
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
        )}

        {activeTab === "environments" && (
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
        )}
      </div>
    </div>
  );
}
