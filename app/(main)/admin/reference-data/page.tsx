"use client";

import { useState } from "react";
import { ChevronRight, FileText, BarChart3, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { ReferenceDataLiveSection } from "@/components/admin/ReferenceDataLiveSection";

// Static data constants
const STATS = [
  { metric: "Total Departments", value: "8", source: "Applications sheet" },
  { metric: "Total Applications", value: "84", source: "Applications sheet" },
  { metric: "Total Releases", value: "80", source: "Releases sheet" },
  { metric: "Total Users", value: "100+", source: "Users, Release Managers, Super Admins" },
  { metric: "Risk Factors", value: "44-46", source: "Risk Factors sheet" },
];

const SECTIONS = [
  { id: "dept", num: 1, name: "Departments" },
  { id: "env", num: 2, name: "Environments" },
  { id: "rel-size", num: 3, name: "Release Sizes" },
  { id: "impact", num: 4, name: "Impact Levels" },
  { id: "priority", num: 5, name: "Priority Levels" },
  { id: "rel-status", num: 6, name: "Release Status Codes" },
  { id: "risk-threshold", num: 7, name: "Risk Score Thresholds" },
  { id: "approval-wf", num: 8, name: "Approval Types & Workflow" },
  { id: "dep-type", num: 9, name: "Dependency Types" },
  { id: "dep-status", num: 10, name: "Dependency Status" },
  { id: "leave-type", num: 11, name: "Leave Types" },
  { id: "user-role", num: 12, name: "User Roles & Permissions" },
  { id: "drift-cat", num: 13, name: "Drift Categories" },
  { id: "freeze-pd", num: 14, name: "Change Freeze Periods" },
  { id: "risk-weight", num: 15, name: "Risk Factor Weights" },
  { id: "shared-env", num: 16, name: "Shared Environments" },
  { id: "int-type", num: 17, name: "Integration Types" },
  { id: "risk-like", num: 18, name: "Risk Likelihood Scale" },
  { id: "risk-imp-scale", num: 19, name: "Risk Impact Scale" },
  { id: "app-cat", num: 20, name: "Application Categories" },
  { id: "notif-type", num: 21, name: "Notification Types" },
  { id: "test-phase", num: 22, name: "Testing Phases & Gates" },
  { id: "deploy-win", num: 23, name: "Deployment Windows" },
  { id: "sla-metric", num: 24, name: "SLA Metrics & Targets" },
];

const DATA = {
  departments: [
    { id: "DEPT-01", code: "FIN", name: "Finance", focus: "Financial planning, reporting, treasury" },
    { id: "DEPT-02", code: "LOG", name: "Logistics", focus: "Warehouse, transportation, supply chain" },
    { id: "DEPT-03", code: "CRM", name: "CRM", focus: "Sales, marketing, customer service" },
    { id: "DEPT-04", code: "MFG", name: "Manufacturing", focus: "Production, quality, MES systems" },
    { id: "DEPT-05", code: "IT", name: "IT", focus: "Infrastructure, monitoring, service desk" },
    { id: "DEPT-06", code: "HR", name: "HR", focus: "HCM, payroll, learning, talent" },
    { id: "DEPT-07", code: "LEG", name: "Legal", focus: "Contracts, compliance, document management" },
    { id: "DEPT-08", code: "SEC", name: "Security", focus: "Identity, access, threat detection" },
  ],
  environments: [
    { code: "DEV", name: "Development", order: "1", availability: "24/7", desc: "Developer sandbox environment" },
    { code: "TEST", name: "Testing", order: "2", availability: "Business Hours", desc: "QA and integration testing" },
    { code: "UAT", name: "User Acceptance", order: "3", availability: "Business Hours", desc: "Business validation environment" },
    { code: "PREPROD", name: "Pre-Production", order: "4", availability: "Business Hours", desc: "Production mirror for final validation" },
    { code: "PROD", name: "Production", order: "5", availability: "24/7", desc: "Live production environment" },
    { code: "DR", name: "Disaster Recovery", order: "6", availability: "24/7", desc: "Business continuity failover" },
  ],
  releaseSizes: [
    { size: "Small", test: "3", uat: "2", preprod: "1", lead: "~8 days", examples: "Bug fixes, minor UI changes" },
    { size: "Medium", test: "5", uat: "3", preprod: "2", lead: "~12 days", examples: "Feature enhancements, integrations" },
    { size: "Large", test: "10", uat: "5", preprod: "4", lead: "~22 days", examples: "Major releases, platform upgrades" },
  ],
  impactLevels: [
    { level: "High", code: "H", color: "#FF0000", desc: "Critical business impact", examples: "Core ERP, Payment Systems" },
    { level: "Medium", code: "M", color: "#FFC000", desc: "Moderate impact, workarounds exist", examples: "Reporting, Secondary CRM" },
    { level: "Low", code: "L", color: "#00B050", desc: "Minimal impact, easily recoverable", examples: "UI changes, Minor enhancements" },
  ],
  priorityLevels: [
    { priority: "Critical", code: "P1", response: "Immediate", escalation: "CIO/VP Level", desc: "Business-stopping issues, security breaches" },
    { priority: "High", code: "P2", response: "4 hours", escalation: "Director Level", desc: "Major degradation, customer impacting" },
    { priority: "Medium", code: "P3", response: "1 business day", escalation: "Manager Level", desc: "Important but not urgent issues" },
    { priority: "Low", code: "P4", response: "5 business days", escalation: "Standard", desc: "Minor issues, enhancements" },
  ],
  statusCodes: [
    { code: "DRAFT", display: "Draft", stage: "Initial", desc: "Release being planned, not yet submitted" },
    { code: "SUBMITTED", display: "Submitted", stage: "Review", desc: "Release submitted for review and approval" },
    { code: "PENDING_CAB", display: "Pending CAB", stage: "Review", desc: "Awaiting Change Advisory Board review" },
    { code: "APPROVED", display: "Approved", stage: "Ready", desc: "All approvals obtained, ready to proceed" },
    { code: "IN_PROGRESS", display: "In Progress", stage: "Active", desc: "Release deployment actively underway" },
    { code: "BLOCKED", display: "Blocked", stage: "Hold", desc: "Release halted due to dependency or issue" },
    { code: "ON_HOLD", display: "On Hold", stage: "Hold", desc: "Temporarily paused for business reasons" },
    { code: "COMPLETED", display: "Completed", stage: "Closed", desc: "Release successfully deployed" },
    { code: "FAILED", display: "Failed", stage: "Closed", desc: "Release deployment failed, rollback executed" },
    { code: "CANCELLED", display: "Cancelled", stage: "Closed", desc: "Release cancelled before deployment" },
  ],
  riskThresholds: [
    { level: "LOW", range: "< 1.5", color: "#00B050", action: "Standard process", approval: "Release Manager" },
    { level: "MEDIUM", range: "1.5 - 2.5", color: "#FFC000", action: "Enhanced monitoring", approval: "Release Manager + Tech Lead" },
    { level: "HIGH", range: "2.5 - 3.5", color: "#FF6600", action: "Risk mitigation plan required", approval: "Director Approval" },
    { level: "CRITICAL", range: "3.5 - 4.0", color: "#FF0000", action: "Executive review, CAB escalation", approval: "VP/CIO Approval" },
    { level: "SEVERE", range: "≥ 4.0", color: "#7030A0", action: "Consider postponement", approval: "Emergency CAB" },
  ],
  approvalWf: [
    { type: "Technical Review", code: "TECH", role: "Tech Lead / Architect", sla: "24", seq: "1" },
    { type: "Security Review", code: "SEC", role: "Security Team", sla: "48", seq: "2" },
    { type: "Business Review", code: "BIZ", role: "Business Owner", sla: "24", seq: "3" },
    { type: "QA Sign-off", code: "QA", role: "QA Lead", sla: "8", seq: "4" },
    { type: "CAB Review", code: "CAB", role: "Change Advisory Board", sla: "48", seq: "5" },
    { type: "Final Approval", code: "FINAL", role: "Release Manager", sla: "4", seq: "6" },
  ],
  depTypes: [
    { type: "Hard", code: "HARD", impact: "Blocking", desc: "Must be resolved before release can proceed" },
    { type: "Soft", code: "SOFT", impact: "Advisory", desc: "Recommended but not mandatory" },
    { type: "Technical", code: "TECH", impact: "Blocking", desc: "Code or infrastructure dependencies" },
    { type: "Data", code: "DATA", impact: "Blocking", desc: "Data migration or sync requirements" },
    { type: "Integration", code: "INTG", impact: "Variable", desc: "External system integration points" },
  ],
  depStatus: [
    { status: "Clear", code: "CLR", color: "#00B050", desc: "Dependency resolved, no action needed" },
    { status: "At Risk", code: "RISK", color: "#FFC000", desc: "Potential issue, requires monitoring" },
    { status: "Blocked", code: "BLK", color: "#FF0000", desc: "Active blocker, must be resolved" },
    { status: "Resolved", code: "RES", color: "#0070C0", desc: "Previously blocked, now cleared" },
  ],
  leaveTypes: [
    { type: "Annual Leave", code: "AL", impact: "Low-Medium", coverage: "If key resource, backup needed" },
    { type: "Personal Leave", code: "PL", impact: "Low", coverage: "Standard handover" },
    { type: "Sick Leave", code: "SL", impact: "Variable", coverage: "Emergency coverage protocol" },
    { type: "Conference", code: "CONF", impact: "Low", coverage: "Planned, backup assigned" },
    { type: "Training", code: "TRN", impact: "Low", coverage: "Planned, limited availability" },
  ],
  userRoles: [
    { role: "Super Admin", code: "SADM", create: "Yes", approve: "Yes", admin: "Yes" },
    { role: "Release Manager", code: "RELMGR", create: "Yes", approve: "Yes", admin: "Limited" },
    { role: "Development Manager", code: "DEVMGR", create: "Yes", approve: "Yes", admin: "No" },
    { role: "QA Lead", code: "QALEAD", create: "No", approve: "Yes", admin: "No" },
    { role: "Tech Lead", code: "TLEAD", create: "Yes", approve: "Yes", admin: "No" },
    { role: "Business Analyst", code: "BA", create: "Yes", approve: "No", admin: "No" },
    { role: "Developer", code: "DEV", create: "Limited", approve: "No", admin: "No" },
    { role: "Tester", code: "TEST", create: "No", approve: "No", admin: "No" },
    { role: "Viewer", code: "VIEW", create: "No", approve: "No", admin: "No" },
    { role: "CAB Member", code: "CAB", create: "No", approve: "Yes", admin: "No" },
  ],
  driftCat: [
    { category: "Infrastructure", code: "INFRA", severity: "High", desc: "Server, network, or hardware drift" },
    { category: "Configuration", code: "CONFIG", severity: "Medium", desc: "Application or system settings drift" },
    { category: "Data", code: "DATA", severity: "High", desc: "Database schema or data inconsistency" },
    { category: "Integration", code: "INTG", severity: "High", desc: "API or interface version mismatch" },
    { category: "Security", code: "SEC", severity: "Critical", desc: "Security patch or certificate drift" },
    { category: "Code", code: "CODE", severity: "Medium", desc: "Unauthorized code changes" },
  ],
  freezePd: [
    { period: "Year-End Freeze", type: "Mandatory", duration: "19 days", timing: "Dec 13 - Dec 31", exceptions: "P1 emergencies only" },
    { period: "Q1 Quarter-End", type: "Advisory", duration: "3 days", timing: "Mar 29 - Mar 31", exceptions: "Pre-approved only" },
    { period: "Q2 Quarter-End", type: "Advisory", duration: "3 days", timing: "Jun 28 - Jun 30", exceptions: "Pre-approved only" },
    { period: "Q3 Quarter-End", type: "Advisory", duration: "3 days", timing: "Sep 28 - Sep 30", exceptions: "Pre-approved only" },
    { period: "Major Events", type: "Variable", duration: "As defined", timing: "Board meetings, audits", exceptions: "Emergency only" },
    { period: "Holiday Periods", type: "Advisory", duration: "Variable", timing: "Public holidays", exceptions: "Minimal changes" },
  ],
  riskWeights: [
    { category: "Technical Complexity", weight: "12%", factors: "5", key: "New Tech Stack, Code Complexity, DB Changes" },
    { category: "Testing Quality", weight: "14%", factors: "6", key: "Test Coverage, Env Parity, Automation" },
    { category: "Security & Compliance", weight: "12%", factors: "5", key: "Vulnerabilities, Pen Test, Compliance Gate" },
    { category: "Data Migration", weight: "10%", factors: "4", key: "Migration Required, Scripts Tested, Backup" },
    { category: "Resource & Schedule", weight: "10%", factors: "4", key: "Team Availability, Overlapping Releases" },
    { category: "Environment & Dependencies", weight: "10%", factors: "4", key: "Upstream/Downstream, Feature Flags" },
    { category: "Operational Readiness", weight: "10%", factors: "5", key: "Rollback Time, Runbook, Automation Level" },
    { category: "Performance & Scalability", weight: "8%", factors: "4", key: "Load Test, Performance Regression" },
    { category: "Release History", weight: "8%", factors: "5", key: "Past Failures, MTBR, MTBF" },
    { category: "Business Criticality", weight: "6%", factors: "4", key: "Revenue Impact, User Blast Radius" },
    { category: "TOTAL", weight: "100%", factors: "46", key: "Full weighted risk assessment" },
  ],
  sharedEnvs: [
    { env: "UAT-Shared-1", shared: "Finance, HR, Legal", booking: "Yes", max: "2 teams", contention: "High" },
    { env: "UAT-Shared-2", shared: "IT, Security", booking: "Yes", max: "2 teams", contention: "Medium" },
    { env: "Test-Integration", shared: "All Departments", booking: "Yes", max: "3 teams", contention: "High" },
    { env: "Pre-Prod-Core", shared: "Finance, Manufacturing", booking: "Yes", max: "1 team", contention: "Critical" },
    { env: "DR-Test", shared: "All Departments", booking: "Yes", max: "1 team", contention: "Medium" },
    { env: "Performance Lab", shared: "IT, CRM, Manufacturing", booking: "Yes", max: "1 team", contention: "High" },
    { env: "Security Scan", shared: "All Departments", booking: "Yes", max: "2 teams", contention: "Medium" },
    { env: "Data Migration", shared: "Finance, HR", booking: "Yes", max: "1 team", contention: "High" },
  ],
  intTypes: [
    { type: "Real-Time API", code: "RT-API", latency: "< 100ms", desc: "Synchronous REST/SOAP calls" },
    { type: "Batch File", code: "BATCH", latency: "Scheduled", desc: "Nightly or scheduled file transfers" },
    { type: "Message Queue", code: "MQ", latency: "< 1 sec", desc: "Asynchronous messaging (Kafka, MQ)" },
    { type: "Database Link", code: "DBLINK", latency: "< 500ms", desc: "Direct database connections" },
    { type: "Event Stream", code: "EVENT", latency: "Near real-time", desc: "Event-driven architecture" },
    { type: "Middleware", code: "MW", latency: "Variable", desc: "ESB or integration platform" },
    { type: "Manual", code: "MANUAL", latency: "N/A", desc: "Human-initiated data entry" },
  ],
  riskLikelihood: [
    { level: "Rare", score: "1", prob: "< 5%", desc: "Unlikely to occur in normal circumstances" },
    { level: "Unlikely", score: "2", prob: "5-25%", desc: "Could occur but not expected" },
    { level: "Possible", score: "3", prob: "25-50%", desc: "May occur at some time" },
    { level: "Likely", score: "4", prob: "50-75%", desc: "Will probably occur" },
    { level: "Almost Certain", score: "5", prob: "> 75%", desc: "Expected to occur in most circumstances" },
  ],
  riskImpactScale: [
    { level: "Negligible", score: "1", cost: "< $10K", desc: "Minor inconvenience, no service impact" },
    { level: "Minor", score: "2", cost: "$10K-$100K", desc: "Limited impact, workarounds available" },
    { level: "Moderate", score: "3", cost: "$100K-$500K", desc: "Significant impact, degraded service" },
    { level: "Major", score: "4", cost: "$500K-$1M", desc: "Major disruption, critical functions affected" },
    { level: "Catastrophic", score: "5", cost: "> $1M", desc: "Complete service failure, regulatory breach" },
  ],
  appCategories: [
    { category: "Core ERP", tier: "Tier 1", criticality: "Mission Critical", apps: "SAP S/4HANA, Oracle EBS" },
    { category: "Financial Systems", tier: "Tier 1", criticality: "Mission Critical", apps: "Treasury, Tax, Revenue Recognition" },
    { category: "Customer Facing", tier: "Tier 1", criticality: "High", apps: "CRM, E-commerce, Portal" },
    { category: "Manufacturing/Operations", tier: "Tier 2", criticality: "High", apps: "MES, WMS, Supply Chain" },
    { category: "HR Systems", tier: "Tier 2", criticality: "Medium", apps: "HCM, Payroll, Recruiting" },
    { category: "Security/Compliance", tier: "Tier 2", criticality: "High", apps: "IAM, SIEM, GRC" },
    { category: "Analytics/Reporting", tier: "Tier 3", criticality: "Medium", apps: "BI Tools, Data Warehouse" },
    { category: "Collaboration", tier: "Tier 3", criticality: "Low", apps: "Email, Messaging, Document Mgmt" },
    { category: "Development Tools", tier: "Tier 3", criticality: "Low", apps: "CI/CD, Repositories, IDEs" },
  ],
  notifTypes: [
    { type: "Release Submitted", trigger: "New release created", recipients: "Tech Lead, QA Lead", channel: "Email, Teams" },
    { type: "Approval Required", trigger: "Review stage reached", recipients: "Designated approver", channel: "Email, Teams" },
    { type: "CAB Scheduled", trigger: "CAB meeting set", recipients: "All stakeholders", channel: "Email, Calendar" },
    { type: "Go-Live Alert", trigger: "24h before deployment", recipients: "All teams", channel: "Email, SMS, Teams" },
    { type: "Deployment Started", trigger: "Release begins", recipients: "Operations, Support", channel: "Teams, Slack" },
    { type: "Deployment Complete", trigger: "Release finished", recipients: "All stakeholders", channel: "Email, Teams" },
    { type: "Rollback Initiated", trigger: "Failure detected", recipients: "All teams, Management", channel: "Email, SMS, Phone" },
  ],
  testPhases: [
    { phase: "Unit Testing", env: "DEV", entry: "Code complete", exit: "> 80% coverage", signoff: "Developer" },
    { phase: "Integration Test", env: "TEST", entry: "Unit tests pass", exit: "All APIs verified", signoff: "Tech Lead" },
    { phase: "System Test", env: "TEST", entry: "Integration complete", exit: "End-to-end scenarios pass", signoff: "QA Lead" },
    { phase: "Performance Test", env: "TEST/PERF", entry: "System test pass", exit: "Meet SLA benchmarks", signoff: "Performance Team" },
    { phase: "Security Test", env: "TEST", entry: "Code freeze", exit: "No critical vulnerabilities", signoff: "Security Team" },
    { phase: "UAT", env: "UAT", entry: "System test pass", exit: "Business sign-off", signoff: "Business Owner" },
    { phase: "Pre-Prod Validation", env: "PREPROD", entry: "UAT complete", exit: "Prod-mirror verified", signoff: "Release Manager" },
    { phase: "Go/No-Go", env: "N/A", entry: "All gates passed", exit: "Final approval", signoff: "CAB" },
  ],
  deployWindows: [
    { window: "Standard", day: "Tue-Thu", time: "02:00 - 06:00", duration: "4 hours", suitable: "Medium/Low risk releases" },
    { window: "Extended", day: "Saturday", time: "00:00 - 08:00", duration: "8 hours", suitable: "Large releases, migrations" },
    { window: "Emergency", day: "Any", time: "As needed", duration: "Minimal", suitable: "P1 hotfixes only" },
    { window: "Maintenance", day: "Sunday", time: "02:00 - 06:00", duration: "4 hours", suitable: "Infra, patching" },
    { window: "Business Hours", day: "Mon-Fri", time: "10:00 - 16:00", duration: "Variable", suitable: "Low risk, no downtime" },
    { window: "Off-Peak", day: "Fri", time: "22:00 - 02:00", duration: "4 hours", suitable: "Regional releases" },
    { window: "Quarterly Major", day: "Saturday", time: "00:00 - 12:00", duration: "12 hours", suitable: "Major upgrades" },
  ],
  slaMetrics: [
    { metric: "Release Success Rate", target: "> 95%", warning: "90-95%", critical: "< 90%", measurement: "Monthly" },
    { metric: "Mean Time to Deploy", target: "< 4 hours", warning: "4-6 hours", critical: "> 6 hours", measurement: "Per release" },
    { metric: "Rollback Rate", target: "< 5%", warning: "5-10%", critical: "> 10%", measurement: "Monthly" },
    { metric: "CAB Approval Time", target: "< 48 hours", warning: "48-72 hours", critical: "> 72 hours", measurement: "Per release" },
    { metric: "Environment Availability", target: "> 99%", warning: "95-99%", critical: "< 95%", measurement: "Weekly" },
    { metric: "Test Pass Rate", target: "> 98%", warning: "95-98%", critical: "< 95%", measurement: "Per release" },
    { metric: "Change Lead Time", target: "< 14 days", warning: "14-21 days", critical: "> 21 days", measurement: "Per release" },
    { metric: "Incident Rate Post-Deploy", target: "< 2%", warning: "2-5%", critical: "> 5%", measurement: "7 days post" },
    { metric: "Documentation Complete", target: "100%", warning: "95-100%", critical: "< 95%", measurement: "Per release" },
    { metric: "Stakeholder Satisfaction", target: "> 4.0/5", warning: "3.5-4.0", critical: "< 3.5", measurement: "Quarterly survey" },
  ],
};

export default function AdminReferenceDataPage() {
  const [activeSection, setActiveSection] = useState("dept");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = SECTIONS.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cellClass = "py-3 px-4 text-sm align-middle whitespace-nowrap";
  const headerClass = "py-3 px-4 text-xs font-semibold uppercase tracking-wider text-left bg-gray-50 text-gray-500 border-b border-gray-200";

  return (
    <div className="flex gap-8 w-full max-w-full font-sans pb-24 min-w-0">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-24 h-[calc(100vh-140px)] flex flex-col border border-gray-200 rounded-xl bg-white p-4 shadow-theme-sm overflow-hidden">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Sections Catalog</h2>
          <input
            type="text"
            placeholder="Search tables..."
            className="w-full text-xs rounded-lg border-gray-200 focus:border-brand-500 focus:ring-brand-500 px-3 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredSections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={cn(
                "w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between",
                activeSection === s.id
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="truncate">{s.num}. {s.name}</span>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
            </button>
          ))}
          {filteredSections.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No sections match query.</p>
          )}
        </div>
      </aside>

      {/* Main Catalog Content */}
      <div className="flex-1 min-w-0 space-y-8">
        <div>
          <div className="flex items-center text-[13px] text-gray-500 font-medium mb-3">
            <span className="hover:text-gray-800 cursor-pointer">Admin</span>
            <ChevronRight className="h-3 w-3 mx-1.5" />
            <span className="text-[#2548C9] font-semibold">Reference Data Catalog</span>
          </div>

          <div className="max-w-[700px] mb-6">
            <h1 className="text-[32px] font-bold text-[#111827] tracking-tight mb-2">Reference Data Catalog</h1>
            <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
              Consolidated lookup tables, status codes, thresholds, and configuration data (Version 1.0 | Generated: June 2026).
            </p>
          </div>
        </div>

        {/* Workbook Stats */}
        <DataTable title="Workbook Statistics" subtitle="Lookup context and sizing statistics" icon={BarChart3}>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={headerClass}>Metric</th>
                <th className={headerClass}>Value</th>
                <th className={headerClass}>Source</th>
              </tr>
            </thead>
            <tbody>
              {STATS.map((s, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className={cn(cellClass, "font-semibold text-gray-700")}>{s.metric}</td>
                  <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{s.value}</td>
                  <td className={cn(cellClass, "text-gray-500")}>{s.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>

        <ReferenceDataLiveSection />

        {/* 1. Departments */}
        <div id="dept" className="scroll-mt-24">
          <DataTable title="1. Departments" subtitle="Organizational code structures" icon={Database}>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Dept ID</th>
                  <th className={headerClass}>Dept Code</th>
                  <th className={headerClass}>Dept Name</th>
                  <th className={headerClass}>Primary Focus</th>
                </tr>
              </thead>
              <tbody>
                {DATA.departments.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-mono font-medium text-gray-500")}>{row.id}</td>
                    <td className={cn(cellClass, "font-bold text-brand-600")}>{row.code}</td>
                    <td className={cn(cellClass, "font-medium text-gray-800")}>{row.name}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 2. Environments */}
        <div id="env" className="scroll-mt-24">
          <DataTable title="2. Environments" subtitle="System environment staging configurations" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Env Code</th>
                  <th className={headerClass}>Env Name</th>
                  <th className={headerClass}>Promotion Order</th>
                  <th className={headerClass}>Availability</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.environments.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cn(cellClass, "font-medium text-gray-800")}>{row.name}</td>
                    <td className={cn(cellClass, "text-center font-bold text-gray-700")}>{row.order}</td>
                    <td className={cellClass}>
                      <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {row.availability}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 3. Release Sizes */}
        <div id="rel-size" className="scroll-mt-24">
          <DataTable title="3. Release Sizes" subtitle="Assigned timelines and phase configurations" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Size</th>
                  <th className={headerClass}>Test Days</th>
                  <th className={headerClass}>UAT Days</th>
                  <th className={headerClass}>Pre-Prod Days</th>
                  <th className={headerClass}>Total Lead Time</th>
                  <th className={headerClass}>Examples</th>
                </tr>
              </thead>
              <tbody>
                {DATA.releaseSizes.map((row) => (
                  <tr key={row.size} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-850")}>{row.size}</td>
                    <td className={cn(cellClass, "font-mono text-center")}>{row.test}</td>
                    <td className={cn(cellClass, "font-mono text-center")}>{row.uat}</td>
                    <td className={cn(cellClass, "font-mono text-center")}>{row.preprod}</td>
                    <td className={cn(cellClass, "font-semibold text-brand-600")}>{row.lead}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 4. Impact Levels */}
        <div id="impact" className="scroll-mt-24">
          <DataTable title="4. Impact Levels" subtitle="Impact assessment scales" icon={Database}>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Level</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Color</th>
                  <th className={headerClass}>Description</th>
                  <th className={headerClass}>Examples</th>
                </tr>
              </thead>
              <tbody>
                {DATA.impactLevels.map((row) => (
                  <tr key={row.level} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.level}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-center")}>{row.code}</td>
                    <td className={cellClass}>
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-600">
                        <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: row.color }} />
                        {row.color}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 5. Priority Levels */}
        <div id="priority" className="scroll-mt-24">
          <DataTable title="5. Priority Levels" subtitle="Operational priority rules" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Priority</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Response Time</th>
                  <th className={headerClass}>Escalation</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.priorityLevels.map((row) => (
                  <tr key={row.priority} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.priority}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cn(cellClass, "font-semibold")}>{row.response}</td>
                    <td className={cn(cellClass, "text-gray-700")}>{row.escalation}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 6. Release Status Codes */}
        <div id="rel-status" className="scroll-mt-24">
          <DataTable title="6. Release Status Codes" subtitle="Lookup of release state codes" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Status Code</th>
                  <th className={headerClass}>Display Name</th>
                  <th className={headerClass}>Stage</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.statusCodes.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cn(cellClass, "font-semibold text-gray-800")}>{row.display}</td>
                    <td className={cellClass}>
                      <span className="inline-flex rounded-md bg-gray-150 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        {row.stage}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 7. Risk Score Thresholds */}
        <div id="risk-threshold" className="scroll-mt-24">
          <DataTable title="7. Risk Score Thresholds" subtitle="Categorized risk scores" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Risk Level</th>
                  <th className={headerClass}>Score Range</th>
                  <th className={headerClass}>Color Code</th>
                  <th className={headerClass}>Action Required</th>
                  <th className={headerClass}>Approval Level</th>
                </tr>
              </thead>
              <tbody>
                {DATA.riskThresholds.map((row) => (
                  <tr key={row.level} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.level}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.range}</td>
                    <td className={cellClass}>
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-600">
                        <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: row.color }} />
                        {row.color}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-700")}>{row.action}</td>
                    <td className={cn(cellClass, "font-semibold text-gray-850")}>{row.approval}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 8. Approval Types & Workflow */}
        <div id="approval-wf" className="scroll-mt-24">
          <DataTable title="8. Approval Types & Workflow" subtitle="Release gates sequence and SLAs" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Approval Type</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Approver Role</th>
                  <th className={headerClass}>SLA (Hours)</th>
                  <th className={headerClass}>Sequence</th>
                </tr>
              </thead>
              <tbody>
                {DATA.approvalWf.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.type}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cn(cellClass, "text-gray-700")}>{row.role}</td>
                    <td className={cn(cellClass, "font-mono text-right font-semibold")}>{row.sla}h</td>
                    <td className={cn(cellClass, "text-center font-bold text-gray-500")}>{row.seq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 9. Dependency Types */}
        <div id="dep-type" className="scroll-mt-24">
          <DataTable title="9. Dependency Types" subtitle="Inter-release block classifications" icon={Database}>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Type</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Impact</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.depTypes.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.type}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cellClass}>
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        row.impact === "Blocking" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {row.impact}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 10. Dependency Status */}
        <div id="dep-status" className="scroll-mt-24">
          <DataTable title="10. Dependency Status" subtitle="State tracking configurations" icon={Database}>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Status</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Color</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.depStatus.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.status}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cellClass}>
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-600">
                        <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: row.color }} />
                        {row.color}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 11. Leave Types */}
        <div id="leave-type" className="scroll-mt-24">
          <DataTable title="11. Leave Types" subtitle="Staff leave resource tracking" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Leave Type</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Risk Impact</th>
                  <th className={headerClass}>Coverage Required</th>
                </tr>
              </thead>
              <tbody>
                {DATA.leaveTypes.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.type}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cn(cellClass, "font-semibold")}>{row.impact}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.coverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 12. User Roles & Permissions */}
        <div id="user-role" className="scroll-mt-24">
          <DataTable title="12. User Roles & Permissions" subtitle="Detailed RBAC system maps" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Role</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Create Release</th>
                  <th className={headerClass}>Approve</th>
                  <th className={headerClass}>Admin</th>
                </tr>
              </thead>
              <tbody>
                {DATA.userRoles.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.role}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cn(cellClass, "text-center")}>{row.create}</td>
                    <td className={cn(cellClass, "text-center")}>{row.approve}</td>
                    <td className={cn(cellClass, "text-center")}>{row.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 13. Drift Categories */}
        <div id="drift-cat" className="scroll-mt-24">
          <DataTable title="13. Drift Categories" subtitle="Environment drift classification types" icon={Database}>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Category</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Severity</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.driftCat.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.category}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cellClass}>
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                        row.severity === "Critical" ? "bg-red-100 text-red-700" : row.severity === "High" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {row.severity}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 14. Change Freeze Periods */}
        <div id="freeze-pd" className="scroll-mt-24">
          <DataTable title="14. Change Freeze Periods" subtitle="Platform release freezes calendar config" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Period</th>
                  <th className={headerClass}>Type</th>
                  <th className={headerClass}>Duration</th>
                  <th className={headerClass}>Timing</th>
                  <th className={headerClass}>Exceptions</th>
                </tr>
              </thead>
              <tbody>
                {DATA.freezePd.map((row) => (
                  <tr key={row.period} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.period}</td>
                    <td className={cn(cellClass, "font-semibold")}>{row.type}</td>
                    <td className={cn(cellClass, "font-mono text-center")}>{row.duration}</td>
                    <td className={cn(cellClass, "font-medium text-[#2548C9]")}>{row.timing}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.exceptions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 15. Risk Factor Weights */}
        <div id="risk-weight" className="scroll-mt-24">
          <DataTable title="15. Risk Factor Weights by Category" subtitle="Weighted components for risk calculation" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Category</th>
                  <th className={headerClass}>Weight %</th>
                  <th className={headerClass}># Factors</th>
                  <th className={headerClass}>Key Factors</th>
                </tr>
              </thead>
              <tbody>
                {DATA.riskWeights.map((row) => (
                  <tr key={row.category} className={cn("border-b border-gray-100 last:border-0 hover:bg-gray-50/50", row.category === "TOTAL" && "font-bold bg-gray-50")}>
                    <td className={cn(cellClass, row.category !== "TOTAL" && "text-gray-800")}>{row.category}</td>
                    <td className={cn(cellClass, "font-mono text-right text-brand-600 font-bold")}>{row.weight}</td>
                    <td className={cn(cellClass, "font-mono text-center")}>{row.factors}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 16. Shared Environments */}
        <div id="shared-env" className="scroll-mt-24">
          <DataTable title="16. Shared Environments" subtitle="Concurrency and contention controls" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Environment</th>
                  <th className={headerClass}>Shared By</th>
                  <th className={headerClass}>Booking Required</th>
                  <th className={headerClass}>Max Concurrent</th>
                  <th className={headerClass}>Contention Level</th>
                </tr>
              </thead>
              <tbody>
                {DATA.sharedEnvs.map((row) => (
                  <tr key={row.env} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.env}</td>
                    <td className={cn(cellClass, "text-gray-600")}>{row.shared}</td>
                    <td className={cn(cellClass, "text-center")}>{row.booking}</td>
                    <td className={cn(cellClass, "font-semibold")}>{row.max}</td>
                    <td className={cellClass}>
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                        row.contention === "Critical" ? "bg-red-100 text-red-700" : row.contention === "High" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {row.contention}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 17. Integration Types */}
        <div id="int-type" className="scroll-mt-24">
          <DataTable title="17. Integration Types" subtitle="API integration metrics" icon={Database}>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Type</th>
                  <th className={headerClass}>Code</th>
                  <th className={headerClass}>Latency Req</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.intTypes.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.type}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-brand-600")}>{row.code}</td>
                    <td className={cn(cellClass, "font-semibold text-gray-700")}>{row.latency}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 18. Risk Likelihood Scale */}
        <div id="risk-like" className="scroll-mt-24">
          <DataTable title="18. Risk Likelihood Scale" subtitle="Probability lookup matrix scales" icon={Database}>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Level</th>
                  <th className={headerClass}>Score</th>
                  <th className={headerClass}>Probability</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.riskLikelihood.map((row) => (
                  <tr key={row.level} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.level}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-center text-brand-600")}>{row.score}</td>
                    <td className={cn(cellClass, "font-semibold text-gray-750")}>{row.prob}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 19. Risk Impact Scale */}
        <div id="risk-imp-scale" className="scroll-mt-24">
          <DataTable title="19. Risk Impact Scale" subtitle="Financial impact scale ranges" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Level</th>
                  <th className={headerClass}>Score</th>
                  <th className={headerClass}>Business Impact</th>
                  <th className={headerClass}>Description</th>
                </tr>
              </thead>
              <tbody>
                {DATA.riskImpactScale.map((row) => (
                  <tr key={row.level} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold")}>{row.level}</td>
                    <td className={cn(cellClass, "font-mono font-bold text-center text-brand-600")}>{row.score}</td>
                    <td className={cn(cellClass, "font-semibold text-red-600")}>{row.cost}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 20. Application Categories */}
        <div id="app-cat" className="scroll-mt-24">
          <DataTable title="20. Application Categories" subtitle="Architecture tier allocations" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Category</th>
                  <th className={headerClass}>Tier</th>
                  <th className={headerClass}>Criticality</th>
                  <th className={headerClass}>Example Applications</th>
                </tr>
              </thead>
              <tbody>
                {DATA.appCategories.map((row) => (
                  <tr key={row.category} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.category}</td>
                    <td className={cn(cellClass, "font-semibold text-gray-600")}>{row.tier}</td>
                    <td className={cellClass}>
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                        row.criticality.includes("Critical") ? "bg-red-100 text-red-700" : row.criticality === "High" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {row.criticality}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.apps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 21. Notification Types */}
        <div id="notif-type" className="scroll-mt-24">
          <DataTable title="21. Notification Types" subtitle="Event notification triggers" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Type</th>
                  <th className={headerClass}>Trigger</th>
                  <th className={headerClass}>Recipients</th>
                  <th className={headerClass}>Channel</th>
                </tr>
              </thead>
              <tbody>
                {DATA.notifTypes.map((row) => (
                  <tr key={row.type} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.type}</td>
                    <td className={cn(cellClass, "text-gray-700")}>{row.trigger}</td>
                    <td className={cn(cellClass, "text-gray-600")}>{row.recipients}</td>
                    <td className={cn(cellClass, "font-semibold text-[#2548C9]")}>{row.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 22. Testing Phases & Gates */}
        <div id="test-phase" className="scroll-mt-24">
          <DataTable title="22. Testing Phases & Gates" subtitle="Testing staging entry/exit gates" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Phase</th>
                  <th className={headerClass}>Environment</th>
                  <th className={headerClass}>Entry Criteria</th>
                  <th className={headerClass}>Exit Criteria</th>
                  <th className={headerClass}>Sign-off Required</th>
                </tr>
              </thead>
              <tbody>
                {DATA.testPhases.map((row) => (
                  <tr key={row.phase} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.phase}</td>
                    <td className={cellClass}>
                      <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {row.env}
                      </span>
                    </td>
                    <td className={cn(cellClass, "text-gray-650")}>{row.entry}</td>
                    <td className={cn(cellClass, "text-gray-650")}>{row.exit}</td>
                    <td className={cn(cellClass, "font-semibold text-gray-800")}>{row.signoff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 23. Deployment Windows */}
        <div id="deploy-win" className="scroll-mt-24">
          <DataTable title="23. Deployment Windows" subtitle="Deployment schedule windows lookup" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Window</th>
                  <th className={headerClass}>Day</th>
                  <th className={headerClass}>Time (Local)</th>
                  <th className={headerClass}>Duration</th>
                  <th className={headerClass}>Suitable For</th>
                </tr>
              </thead>
              <tbody>
                {DATA.deployWindows.map((row) => (
                  <tr key={row.window} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-bold text-gray-800")}>{row.window}</td>
                    <td className={cn(cellClass, "font-medium text-gray-700")}>{row.day}</td>
                    <td className={cn(cellClass, "font-mono font-medium text-[#2548C9]")}>{row.time}</td>
                    <td className={cn(cellClass, "text-center")}>{row.duration}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.suitable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>

        {/* 24. SLA Metrics & Targets */}
        <div id="sla-metric" className="scroll-mt-24">
          <DataTable title="24. SLA Metrics & Targets" subtitle="Target lookup SLA configurations" icon={Database}>
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th className={headerClass}>Metric</th>
                  <th className={headerClass}>Target</th>
                  <th className={headerClass}>Warning</th>
                  <th className={headerClass}>Critical</th>
                  <th className={headerClass}>Measurement</th>
                </tr>
              </thead>
              <tbody>
                {DATA.slaMetrics.map((row) => (
                  <tr key={row.metric} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className={cn(cellClass, "font-semibold text-gray-850")}>{row.metric}</td>
                    <td className={cn(cellClass, "font-mono text-emerald-600 font-bold")}>{row.target}</td>
                    <td className={cn(cellClass, "font-mono text-amber-600 font-bold")}>{row.warning}</td>
                    <td className={cn(cellClass, "font-mono text-red-600 font-bold")}>{row.critical}</td>
                    <td className={cn(cellClass, "text-gray-500")}>{row.measurement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>
      </div>
    </div>
  );
}
