import type {
  ActivityFeedItem,
  AgentMeta,
  Approval,
  ApprovalGate,
  CabSession,
  Connector,
  FreezeWindow,
  HistoricalTrendPoint,
  Release,
  ReleaseStatus,
  Service,
  TeamMember,
} from "./types";

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

const TEAMS = ["Platform", "Billing", "Search", "Payments", "Core", "Identity", "Mobile", "Data"] as const;
const OWNERS = ["Priya Sharma", "Alex Kim", "Mike Torres", "Raj Patel", "Sarah Chen", "Jordan Lee", "Emma Walsh"];
const TICKET_STATUSES = ["Open", "In Progress", "Done", "Blocked"] as const;

const defaultApprovals = (
  overrides: Partial<Record<ApprovalGate, Partial<Approval>>> = {}
): Approval[] => {
  const gates: ApprovalGate[] = ["QA", "Security", "Database", "Business", "Change"];
  return gates.map((gate) => ({
    gate,
    status: "Approved" as const,
    approver: "System",
    timestamp: daysAgo(5),
    ...(overrides[gate] ?? {}),
  }));
};

const typicalHours = { QA: 4, Security: 6, Database: 8, Business: 12, Change: 24 };

function generateRelease(n: number): Release {
  const shipped = n < 32;
  const team = TEAMS[n % TEAMS.length];
  const owner = OWNERS[n % OWNERS.length];
  const dateOffset = shipped ? -(n * 5 + 2) : (n - 31) * 3 + 4;
  const targetDate = dateOffset < 0 ? daysAgo(-dateOffset) : daysFromNow(dateOffset);
  const major = 2;
  const minor = 8 + Math.floor(n / 8);
  const patch = n % 20;
  const version = `v${major}.${minor}.${patch}`;
  const filesChanged = 35 + n * 17 + (n % 7) * 40;
  const svc = services[n % services.length];
  const svc2 = services[(n + 3) % services.length];

  let status: ReleaseStatus = shipped ? "Shipped" : "Scheduled";
  if (!shipped) {
    if (n % 5 === 0) status = "At Risk";
    else if (n % 11 === 0) status = "Blocked";
    else if (n % 7 === 0) status = "Ready";
  }

  const openTickets = shipped ? 0 : 1 + (n % 4);
  const tickets = Array.from({ length: openTickets + (shipped ? 2 : 1) }, (_, ti) => {
    const done = shipped || ti >= openTickets;
    return {
      id: `${team.slice(0, 3).toUpperCase()}-${2000 + n * 10 + ti}`,
      title: [`API migration`, `Security hardening`, `Performance tuning`, `Bug fixes`, `Feature flag cleanup`][ti % 5],
      status: done ? ("Done" as const) : (TICKET_STATUSES[(n + ti) % 3] as (typeof TICKET_STATUSES)[number]),
      assignee: team,
    };
  });

  const buildFailed = !shipped && n % 11 === 0;
  const buildRunning = !shipped && !buildFailed && n % 9 === 0;
  const testCount = 400 + n * 15;
  const passedTests = buildFailed ? testCount - 18 - (n % 10) : buildRunning ? Math.floor(testCount * 0.7) : testCount;

  const pendingGates: Partial<Record<ApprovalGate, Partial<Approval>>> = {};
  if (!shipped) {
    if (n % 5 === 0) pendingGates.Security = { status: "Pending", pendingSince: daysAgo(2 + (n % 3)) };
    if (n % 7 === 0) pendingGates.Business = { status: "Pending", pendingSince: daysAgo(1) };
    if (n % 4 === 0) pendingGates.QA = { status: "Pending", pendingSince: daysAgo(0.5) };
  }
  if (buildFailed) pendingGates.QA = { status: "Rejected", approver: "Mike Torres", timestamp: daysAgo(0.1) };

  const targetDay = new Date(targetDate).getDay();
  const isFriday = targetDay === 5;

  return {
    id: `rel-gen-${n}`,
    name: `${team} ${shipped ? "Release" : "Sprint Release"}`,
    version,
    team,
    owner,
    targetDate,
    status,
    decision: shipped ? (n % 9 === 0 ? "No-Go" : "Go") : null,
    filesChanged,
    typicalApprovalHours: typicalHours,
    commits: [
      { sha: `${n}a1b2c3`, message: `Feature batch ${n}`, author: team, timestamp: daysAgo(n + 2) },
      { sha: `${n}d4e5f6`, message: `Config updates for ${svc.name}`, author: owner, timestamp: daysAgo(n + 1) },
    ],
    dependsOnServices: n % 3 === 0 ? [svc.id, svc2.id] : [svc.id],
    incidentHistory:
      shipped && (n % 5 === 0 || isFriday)
        ? [{ id: `inc-g${n}`, date: daysAgo(n * 4), severity: n % 10 === 0 ? "Sev-2" : "Sev-3", summary: isFriday ? "Friday deploy rollback" : "Minor post-release incident" }]
        : [],
    tickets,
    approvals: defaultApprovals(pendingGates),
    build: {
      id: `${4300 + n}`,
      status: buildFailed ? "Failed" : buildRunning ? "Running" : "Passed",
      pipeline: n % 4 === 0 ? "Azure Pipelines" : "GitHub Actions",
      lastRun: daysAgo(n * 0.3),
      testCount,
      passedTests,
    },
    notes: isFriday ? "Friday release window — elevated rollback risk historically." : n % 6 === 0 ? "Requires coordinated DB migration." : "",
    history: [
      { id: `hg${n}-1`, timestamp: daysAgo(n + 1), actor: owner, action: `Created release ${version}`, type: "human" },
      ...(shipped
        ? [{ id: `hg${n}-2`, timestamp: daysAgo(n), actor: owner, action: `Marked Go for ${version}`, type: "human" as const }]
        : n % 5 === 0
          ? [{ id: `hg${n}-2`, timestamp: daysAgo(0.5), actor: "Risk Agent", action: `Flagged elevated file count (${filesChanged} files)`, type: "agent" as const, agent: "Risk Agent" as const }]
          : []),
    ],
  };
}

export const teamMembers: TeamMember[] = [
  { id: "u1", name: "Priya Sharma", role: "Release Manager", email: "priya@company.com" },
  { id: "u2", name: "Raj Patel", role: "DB Lead", email: "raj@company.com" },
  { id: "u3", name: "Sarah Chen", role: "Security Lead", email: "sarah@company.com" },
  { id: "u4", name: "Mike Torres", role: "QA Lead", email: "mike@company.com" },
  { id: "u5", name: "Alex Kim", role: "Engineering Manager", email: "alex@company.com" },
  { id: "u6", name: "Jordan Lee", role: "Platform Engineer", email: "jordan@company.com" },
  { id: "u7", name: "Emma Walsh", role: "SRE Lead", email: "emma@company.com" },
  { id: "u8", name: "Chris Nguyen", role: "Payments Lead", email: "chris@company.com" },
  { id: "u9", name: "Lisa Park", role: "Product Owner", email: "lisa@company.com" },
  { id: "u10", name: "Tom Bradley", role: "Change Manager", email: "tom@company.com" },
  { id: "u11", name: "Nina Okonkwo", role: "Mobile Lead", email: "nina@company.com" },
  { id: "u12", name: "David Frost", role: "Data Platform Lead", email: "david@company.com" },
];

export const services: Service[] = [
  { id: "svc-auth", name: "auth-service", dependsOn: [], criticality: "Critical", recentIncidents: [], unstable: false },
  { id: "svc-payments", name: "payments-api", dependsOn: ["svc-auth"], criticality: "Critical", recentIncidents: [{ id: "inc-1", date: daysAgo(45), severity: "Sev-2", summary: "Payment timeout spike" }], unstable: true },
  { id: "svc-billing", name: "billing-worker", dependsOn: ["svc-payments", "svc-auth"], criticality: "High", recentIncidents: [], unstable: false },
  { id: "svc-notify", name: "notification-hub", dependsOn: ["svc-auth"], criticality: "Medium", recentIncidents: [], unstable: false },
  { id: "svc-ledger", name: "ledger-service", dependsOn: ["svc-payments"], criticality: "Critical", recentIncidents: [{ id: "inc-2", date: daysAgo(60), severity: "Sev-1", summary: "Ledger reconciliation failure" }], unstable: false },
  { id: "svc-gateway", name: "api-gateway", dependsOn: ["svc-auth"], criticality: "Critical", recentIncidents: [], unstable: false },
  { id: "svc-search", name: "search-index", dependsOn: ["svc-gateway"], criticality: "Medium", recentIncidents: [], unstable: false },
  { id: "svc-report", name: "reporting-api", dependsOn: ["svc-ledger", "svc-billing"], criticality: "High", recentIncidents: [], unstable: false },
  { id: "svc-cache", name: "cache-layer", dependsOn: [], criticality: "High", recentIncidents: [], unstable: false },
  { id: "svc-audit", name: "audit-logger", dependsOn: ["svc-gateway"], criticality: "Medium", recentIncidents: [], unstable: false },
  { id: "svc-identity", name: "identity-provider", dependsOn: ["svc-auth"], criticality: "Critical", recentIncidents: [{ id: "inc-3", date: daysAgo(30), severity: "Sev-3", summary: "Token refresh latency" }], unstable: false },
  { id: "svc-mobile", name: "mobile-bff", dependsOn: ["svc-gateway", "svc-auth"], criticality: "High", recentIncidents: [], unstable: false },
  { id: "svc-analytics", name: "analytics-pipeline", dependsOn: ["svc-report", "svc-cache"], criticality: "Medium", recentIncidents: [], unstable: true },
  { id: "svc-fraud", name: "fraud-detection", dependsOn: ["svc-payments", "svc-analytics"], criticality: "Critical", recentIncidents: [{ id: "inc-4", date: daysAgo(14), severity: "Sev-2", summary: "False positive surge" }], unstable: false },
];

const anchorReleases: Release[] = [
  {
    id: "rel-v2140",
    name: "Platform Release",
    version: "v2.14.0",
    team: "Platform",
    owner: "Priya Sharma",
    targetDate: daysFromNow(1),
    status: "At Risk",
    decision: null,
    filesChanged: 847,
    typicalApprovalHours: typicalHours,
    commits: [
      { sha: "a3f9c2d", message: "Refactor payment routing logic", author: "Jordan Lee", timestamp: daysAgo(2) },
      { sha: "b7e1a04", message: "Add fraud detection hooks", author: "Chris Nguyen", timestamp: daysAgo(1) },
      { sha: "f1c8d92", message: "Update gateway rate limits", author: "Jordan Lee", timestamp: daysAgo(0.5) },
    ],
    dependsOnServices: ["svc-payments", "svc-auth", "svc-gateway", "svc-fraud"],
    incidentHistory: [{ id: "inc-r1", date: daysAgo(90), severity: "Sev-2", summary: "Post-release latency on payments-api" }],
    tickets: [
      { id: "PLAT-4412", title: "Payment routing refactor", status: "Done", assignee: "Jordan Lee" },
      { id: "PLAT-4418", title: "Security review checklist", status: "In Progress", assignee: "Sarah Chen" },
      { id: "PLAT-4420", title: "Load test payments-api", status: "Done", assignee: "Emma Walsh" },
      { id: "PLAT-4422", title: "Update runbook for migration", status: "Open", assignee: "Priya Sharma" },
    ],
    approvals: defaultApprovals({
      Security: { status: "Pending", pendingSince: daysAgo(3) },
      QA: { status: "Approved", approver: "Mike Torres", timestamp: daysAgo(1) },
      Database: { status: "Approved", approver: "Raj Patel", timestamp: daysAgo(2) },
      Business: { status: "Approved", approver: "Lisa Park", timestamp: daysAgo(1.5) },
    }),
    build: { id: "4471", status: "Passed", pipeline: "GitHub Actions", lastRun: daysAgo(0.5), testCount: 1240, passedTests: 1240 },
    notes: "Database migration needs maintenance window before ship.",
    changeRecord: {
      crNumber: "CR-8842",
      riskTier: "High",
      scheduledStart: daysFromNow(1),
      scheduledEnd: daysFromNow(1.08),
      backoutPlan:
        "Revert payment routing via blue-green switch. Run DB migration rollback script rollback_v2140.sql if schema changes applied.",
      affectedServices: ["payments-api", "auth-service", "api-gateway", "fraud-detection"],
      description: "Platform release v2.14.0 — payment routing refactor, fraud detection hooks, gateway rate limits.",
      cabStatus: "Pending",
      cabSessionDate: daysFromNow(0.5),
      submittedBy: "Tom Bradley",
    },
    history: [
      { id: "h1", timestamp: daysAgo(3), actor: "Mike Torres", action: "Approved QA gate", type: "human" },
      { id: "h2", timestamp: daysAgo(2), actor: "Risk Agent", action: "Flagged unusual file-change volume (847 files)", type: "agent", agent: "Risk Agent" },
      { id: "h3", timestamp: daysAgo(1.5), actor: "Lisa Park", action: "Approved Business gate", type: "human" },
      { id: "h4", timestamp: daysAgo(1), actor: "Dependency Agent", action: "Flagged payments-api blast radius (4 dependents)", type: "agent", agent: "Dependency Agent" },
    ],
  },
  {
    id: "rel-v2135",
    name: "Billing Hotfix",
    version: "v2.13.5",
    team: "Billing",
    owner: "Alex Kim",
    targetDate: daysFromNow(3),
    status: "Blocked",
    decision: null,
    filesChanged: 42,
    typicalApprovalHours: typicalHours,
    commits: [
      { sha: "c4d8e91", message: "Fix invoice rounding bug", author: "Chris Nguyen", timestamp: daysAgo(1) },
      { sha: "d9e2f14", message: "Add regression test for rounding", author: "Mike Torres", timestamp: daysAgo(0.8) },
    ],
    dependsOnServices: ["svc-billing", "svc-ledger"],
    incidentHistory: [{ id: "inc-r2", date: daysAgo(5), severity: "Sev-3", summary: "Customer reported incorrect invoice totals" }],
    tickets: [
      { id: "BILL-892", title: "Invoice rounding fix", status: "Done", assignee: "Chris Nguyen" },
      { id: "BILL-893", title: "Integration test failures", status: "Blocked", assignee: "Mike Torres" },
    ],
    approvals: defaultApprovals({
      QA: { status: "Rejected", approver: "Mike Torres", timestamp: daysAgo(0.1) },
      Security: { status: "Approved", approver: "Sarah Chen", timestamp: daysAgo(0.5) },
    }),
    build: { id: "4468", status: "Failed", pipeline: "GitHub Actions", lastRun: daysAgo(0.2), testCount: 320, passedTests: 298 },
    notes: "Build failed on integration tests — investigating.",
    history: [
      { id: "h5", timestamp: daysAgo(0.2), actor: "Build Agent", action: "Build #4468 failed — 22 test failures in invoice suite", type: "agent", agent: "Build Agent" },
      { id: "h6", timestamp: daysAgo(0.15), actor: "Mike Torres", action: "Rejected QA gate pending build fix", type: "human" },
    ],
  },
  {
    id: "rel-v2150",
    name: "Search Enhancement",
    version: "v2.15.0",
    team: "Search",
    owner: "Priya Sharma",
    targetDate: daysFromNow(7),
    status: "Scheduled",
    decision: null,
    filesChanged: 1203,
    typicalApprovalHours: typicalHours,
    commits: [
      { sha: "e5f2b33", message: "Elasticsearch index rebuild", author: "David Frost", timestamp: daysAgo(4) },
      { sha: "g7h8i99", message: "Query optimizer rewrite", author: "David Frost", timestamp: daysAgo(3) },
    ],
    dependsOnServices: ["svc-search", "svc-cache", "svc-gateway", "svc-analytics"],
    incidentHistory: [],
    tickets: [
      { id: "SRCH-201", title: "Index rebuild", status: "In Progress", assignee: "David Frost" },
      { id: "SRCH-205", title: "Query performance tests", status: "Open", assignee: "David Frost" },
      { id: "SRCH-210", title: "Security scan review", status: "Open", assignee: "Sarah Chen" },
    ],
    approvals: defaultApprovals({
      QA: { status: "Pending", pendingSince: daysAgo(1) },
      Security: { status: "Pending", pendingSince: daysAgo(1) },
      Database: { status: "Pending", pendingSince: daysAgo(1) },
      Business: { status: "Pending", pendingSince: daysAgo(1) },
      Change: { status: "Pending", pendingSince: daysAgo(1) },
    }),
    build: { id: "4465", status: "Running", pipeline: "GitHub Actions", lastRun: daysAgo(0.1), testCount: 890, passedTests: 650 },
    notes: "Large index migration — high file count release.",
    history: [
      { id: "h7", timestamp: daysAgo(4), actor: "Priya Sharma", action: "Created release v2.15.0", type: "human" },
      { id: "h8", timestamp: daysAgo(0.3), actor: "Risk Agent", action: "Flagged 1203 files — 4.3x team median", type: "agent", agent: "Risk Agent" },
    ],
  },
  {
    id: "rel-v2141",
    name: "Mobile App Release",
    version: "v2.14.1",
    team: "Mobile",
    owner: "Nina Okonkwo",
    targetDate: daysFromNow(2),
    status: "Ready",
    decision: null,
    filesChanged: 156,
    typicalApprovalHours: typicalHours,
    commits: [{ sha: "m1o2b3i", message: "Push notification improvements", author: "Nina Okonkwo", timestamp: daysAgo(1) }],
    dependsOnServices: ["svc-mobile", "svc-notify", "svc-auth"],
    incidentHistory: [],
    tickets: [
      { id: "MOB-301", title: "Push notification batching", status: "Done", assignee: "Nina Okonkwo" },
      { id: "MOB-302", title: "iOS regression suite", status: "Done", assignee: "Mike Torres" },
    ],
    approvals: defaultApprovals(),
    build: { id: "4472", status: "Passed", pipeline: "GitHub Actions", lastRun: daysAgo(0.3), testCount: 540, passedTests: 540 },
    notes: "Low-risk mobile patch — all gates green.",
    history: [{ id: "h9", timestamp: daysAgo(0.5), actor: "Mike Torres", action: "Approved QA gate", type: "human" }],
  },
  {
    id: "rel-v2138",
    name: "Identity Patch",
    version: "v2.13.8",
    team: "Identity",
    owner: "Sarah Chen",
    targetDate: daysFromNow(5),
    status: "At Risk",
    decision: null,
    filesChanged: 312,
    typicalApprovalHours: typicalHours,
    commits: [{ sha: "i4d3e2n", message: "OAuth scope tightening", author: "Sarah Chen", timestamp: daysAgo(2) }],
    dependsOnServices: ["svc-identity", "svc-auth"],
    incidentHistory: [],
    tickets: [
      { id: "IDN-110", title: "OAuth scope audit", status: "In Progress", assignee: "Sarah Chen" },
      { id: "IDN-112", title: "Pen test remediation", status: "Open", assignee: "Sarah Chen" },
    ],
    approvals: defaultApprovals({
      Security: { status: "Pending", pendingSince: daysAgo(1.5) },
      Change: { status: "Pending", pendingSince: daysAgo(2) },
    }),
    build: { id: "4469", status: "Passed", pipeline: "Azure Pipelines", lastRun: daysAgo(0.4), testCount: 680, passedTests: 680 },
    notes: "Security-sensitive — awaiting pen test sign-off.",
    history: [{ id: "h10", timestamp: daysAgo(1), actor: "Approval Agent", action: "Security sign-off pending 36h (typical: 6h)", type: "agent", agent: "Approval Agent" }],
  },
];

export const releases: Release[] = [
  ...anchorReleases,
  ...Array.from({ length: 45 }, (_, i) => generateRelease(i)),
];

export const cabSessions: CabSession[] = [
  {
    id: "cab-weekly",
    title: "Weekly Production CAB",
    date: daysFromNow(0.5),
    releaseIds: ["rel-v2140", "rel-v2141"],
    chair: "Tom Bradley",
    status: "Scheduled",
  },
  {
    id: "cab-emergency",
    title: "Emergency CAB — Billing Hotfix",
    date: daysFromNow(2),
    releaseIds: ["rel-v2135"],
    chair: "Tom Bradley",
    status: "Scheduled",
  },
  {
    id: "cab-search",
    title: "Large Change Review — Search v2.15.0",
    date: daysFromNow(5),
    releaseIds: ["rel-v2150"],
    chair: "Lisa Park",
    status: "Scheduled",
  },
];

export const freezeWindows: FreezeWindow[] = [
  {
    id: "fw-month-end",
    name: "Month-end financial close",
    start: daysFromNow(12),
    end: daysFromNow(16),
    reason: "No production changes during financial reconciliation",
  },
  {
    id: "fw-holiday",
    name: "Holiday blackout",
    start: daysFromNow(45),
    end: daysFromNow(52),
    reason: "Reduced on-call coverage — all non-critical changes deferred",
  },
];

export interface SearchResult {
  id: string;
  type: "release" | "ticket" | "change";
  label: string;
  sublabel: string;
  href: string;
}

export function searchAll(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  releases.forEach((r) => {
    if (
      r.version.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.team.toLowerCase().includes(q) ||
      r.owner.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    ) {
      results.push({
        id: `rel-${r.id}`,
        type: "release",
        label: `${r.version} — ${r.name}`,
        sublabel: `${r.team} · ${r.status}`,
        href: `/releases/${r.id}`,
      });
    }

    r.tickets.forEach((t) => {
      if (t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)) {
        results.push({
          id: `tkt-${t.id}`,
          type: "ticket",
          label: t.id,
          sublabel: `${t.title} · ${r.version}`,
          href: `/releases/${r.id}`,
        });
      }
    });

    if (r.changeRecord && r.changeRecord.crNumber.toLowerCase().includes(q)) {
      results.push({
        id: `cr-${r.changeRecord.crNumber}`,
        type: "change",
        label: r.changeRecord.crNumber,
        sublabel: `${r.version} · ${r.changeRecord.riskTier} risk · CAB ${r.changeRecord.cabStatus}`,
        href: `/releases/${r.id}`,
      });
    }
  });

  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).slice(0, 12);
}

export const historicalTrend: HistoricalTrendPoint[] = Array.from({ length: 26 }, (_, i) => {
  const weekDate = new Date();
  weekDate.setDate(weekDate.getDate() - (25 - i) * 7);
  const week = weekDate.toISOString().slice(0, 10);
  const dip = i >= 8 && i <= 12;
  const fridaySpike = i === 6 || i === 14 || i === 20;
  return {
    week,
    avgReadiness: dip ? 58 + (i - 8) * 4 : fridaySpike ? 71 : 78 + Math.sin(i / 3) * 8 + i * 0.25,
    rollbackCount: dip ? 5 - Math.abs(i - 10) : fridaySpike ? 3 : i % 4 === 0 ? 2 : i % 7 === 0 ? 1 : 0,
  };
});

export const connectors: Connector[] = [
  { id: "c1", name: "Jira", description: "Ticket tracker — 1,842 open stories synced", status: "Connected", lastSynced: daysAgo(0.01), maskedToken: "jira_••••••••4f2a" },
  { id: "c2", name: "GitHub Actions", description: "CI/CD — 12 active pipelines", status: "Connected", lastSynced: daysAgo(0.02), maskedToken: "ghp_••••••••9b1c" },
  { id: "c3", name: "Datadog", description: "Monitoring — 48 services tracked", status: "Connected", lastSynced: daysAgo(0.05), maskedToken: "dd_••••••••7e3d" },
  { id: "c4", name: "ServiceNow", description: "Change management — 6 open CRs", status: "Connected", lastSynced: daysAgo(0.1), maskedToken: "sn_••••••••2a8f" },
  { id: "c5", name: "Snyk", description: "Security — 3 critical vulns flagged", status: "Connected", lastSynced: daysAgo(0.08), maskedToken: "sk-••••••••1c4e" },
  { id: "c6", name: "Confluence", description: "Documentation — 24 runbooks linked", status: "Connected", lastSynced: daysAgo(0.15), maskedToken: "conf_••••••••6d9b" },
  { id: "c7", name: "Slack", description: "Notifications — #releases channel", status: "Connected", lastSynced: daysAgo(0.01), maskedToken: "xoxb-••••••••3f7a" },
  { id: "c8", name: "PagerDuty", description: "Incidents — 2 active Sev-2", status: "Connected", lastSynced: daysAgo(0.03), maskedToken: "pd_••••••••8e2c" },
];

export const activityFeed: ActivityFeedItem[] = [
  { id: "af1", timestamp: daysAgo(0.05), type: "human", actor: "Raj Patel", message: "Approved Database gate for v2.14.0", releaseId: "rel-v2140" },
  { id: "af2", timestamp: daysAgo(0.1), type: "agent", actor: "Risk Agent", agent: "Risk Agent", message: "Flagged unusual file-change volume on v2.14.0 (847 files vs ~280 median)", releaseId: "rel-v2140" },
  { id: "af3", timestamp: daysAgo(0.15), type: "human", actor: "Mike Torres", message: "Approved QA gate for v2.14.0", releaseId: "rel-v2140" },
  { id: "af4", timestamp: daysAgo(0.2), type: "agent", actor: "Build Agent", agent: "Build Agent", message: "Build #4468 failed for v2.13.5 — 22 integration test failures", releaseId: "rel-v2135" },
  { id: "af5", timestamp: daysAgo(0.25), type: "agent", actor: "Approval Agent", agent: "Approval Agent", message: "Security sign-off pending 72h on v2.14.0 (typical: 6h)", releaseId: "rel-v2140" },
  { id: "af6", timestamp: daysAgo(0.3), type: "human", actor: "Priya Sharma", message: "Created release v2.15.0", releaseId: "rel-v2150" },
  { id: "af7", timestamp: daysAgo(0.35), type: "agent", actor: "Dependency Agent", agent: "Dependency Agent", message: "v2.14.0 touches payments-api — 3 downstream services depend on it", releaseId: "rel-v2140" },
  { id: "af8", timestamp: daysAgo(0.4), type: "human", actor: "Sarah Chen", message: "Started Security review for v2.14.0", releaseId: "rel-v2140" },
  { id: "af9", timestamp: daysAgo(0.5), type: "human", actor: "Lisa Park", message: "Approved Business gate for v2.14.0", releaseId: "rel-v2140" },
  { id: "af10", timestamp: daysAgo(0.6), type: "human", actor: "Nina Okonkwo", message: "All gates green for v2.14.1 mobile patch", releaseId: "rel-v2141" },
  { id: "af11", timestamp: daysAgo(0.7), type: "agent", actor: "Ticket Agent", agent: "Ticket Agent", message: "PLAT-4422 runbook update still open for v2.14.0", releaseId: "rel-v2140" },
  { id: "af12", timestamp: daysAgo(0.8), type: "agent", actor: "Risk Agent", agent: "Risk Agent", message: "v2.15.0 file count 1203 — flagged as unusually large", releaseId: "rel-v2150" },
  { id: "af13", timestamp: daysAgo(1), type: "human", actor: "Tom Bradley", message: "Submitted change request CR-8842 for v2.14.0", releaseId: "rel-v2140" },
  { id: "af14", timestamp: daysAgo(1.2), type: "agent", actor: "Build Agent", agent: "Build Agent", message: "Build #4465 still running for v2.15.0 — 73% tests complete", releaseId: "rel-v2150" },
  { id: "af15", timestamp: daysAgo(1.5), type: "human", actor: "Mike Torres", message: "Rejected QA gate for v2.13.5 pending build fix", releaseId: "rel-v2135" },
  { id: "af16", timestamp: daysAgo(2), type: "agent", actor: "Approval Agent", agent: "Approval Agent", message: "Identity v2.13.8 Security review overdue 36h", releaseId: "rel-v2138" },
  { id: "af17", timestamp: daysAgo(2.5), type: "human", actor: "Emma Walsh", message: "Load test passed for payments-api (v2.14.0 scope)", releaseId: "rel-v2140" },
  { id: "af18", timestamp: daysAgo(3), type: "agent", actor: "Summary Agent", agent: "Summary Agent", message: "Morning digest: 5 active releases, 2 at risk, 1 blocked", releaseId: undefined },
  { id: "af19", timestamp: daysAgo(3.5), type: "human", actor: "Alex Kim", message: "Escalated v2.13.5 build failure to Platform team", releaseId: "rel-v2135" },
  { id: "af20", timestamp: daysAgo(4), type: "agent", actor: "Dependency Agent", agent: "Dependency Agent", message: "analytics-pipeline marked unstable — v2.15.0 touches this service", releaseId: "rel-v2150" },
  { id: "af21", timestamp: daysAgo(5), type: "human", actor: "David Frost", message: "Index rebuild 60% complete for v2.15.0", releaseId: "rel-v2150" },
  { id: "af22", timestamp: daysAgo(6), type: "agent", actor: "Risk Agent", agent: "Risk Agent", message: "Friday releases show 2x rollback rate in last 6 months", releaseId: undefined },
  { id: "af23", timestamp: daysAgo(7), type: "human", actor: "Chris Nguyen", message: "Shipped v2.12.4 Payments release successfully", releaseId: "rel-gen-28" },
  { id: "af24", timestamp: daysAgo(8), type: "agent", actor: "Conversation Agent", agent: "Conversation Agent", message: "Answered 14 release readiness questions today", releaseId: undefined },
  { id: "af25", timestamp: daysAgo(10), type: "human", actor: "Jordan Lee", message: "Merged payment routing PR for v2.14.0", releaseId: "rel-v2140" },
  { id: "af26", timestamp: daysAgo(12), type: "agent", actor: "Ticket Agent", agent: "Ticket Agent", message: "BILL-893 blocked — integration test suite failing", releaseId: "rel-v2135" },
  { id: "af27", timestamp: daysAgo(14), type: "human", actor: "Sarah Chen", message: "Approved Security gate for v2.13.5", releaseId: "rel-v2135" },
  { id: "af28", timestamp: daysAgo(16), type: "agent", actor: "Build Agent", agent: "Build Agent", message: "Suspect commit c4d8e91 linked to v2.13.5 test failures", releaseId: "rel-v2135" },
  { id: "af29", timestamp: daysAgo(18), type: "human", actor: "Priya Sharma", message: "Marked Go for v2.12.0 Core release", releaseId: "rel-gen-20" },
  { id: "af30", timestamp: daysAgo(21), type: "agent", actor: "Risk Agent", agent: "Risk Agent", message: "Rollback recorded for Friday v2.11.3 deploy", releaseId: "rel-gen-15" },
];

export const agents: AgentMeta[] = [
  {
    id: "ag1", name: "Ticket Agent", watches: "Linked tickets/stories", description: "Flags stuck or reopened tickets",
    status: "Active", lastRanMinutesAgo: 4, sparkline: [2, 3, 1, 4, 2, 3, 5],
    sampleFindings: [
      { text: "PLAT-4418 Security review still in progress", releaseId: "rel-v2140", timestamp: daysAgo(0.1) },
      { text: "PLAT-4422 runbook update open — blocking documentation gate", releaseId: "rel-v2140", timestamp: daysAgo(0.3) },
      { text: "BILL-893 integration tests blocked", releaseId: "rel-v2135", timestamp: daysAgo(0.5) },
    ],
  },
  {
    id: "ag2", name: "Build Agent", watches: "CI/CD connector", description: "Explains build failures in plain English",
    status: "Active", lastRanMinutesAgo: 2, sparkline: [1, 2, 5, 3, 2, 1, 4],
    sampleFindings: [
      { text: "Build #4468 failed — 22 invoice integration test failures", releaseId: "rel-v2135", timestamp: daysAgo(0.2) },
      { text: "Suspect commit c4d8e91 — rounding logic change", releaseId: "rel-v2135", timestamp: daysAgo(0.4) },
      { text: "Build #4465 running — 73% complete for v2.15.0", releaseId: "rel-v2150", timestamp: daysAgo(0.1) },
    ],
  },
  {
    id: "ag3", name: "Approval Agent", watches: "Approval checklist", description: "Nudges overdue sign-offs",
    status: "Active", lastRanMinutesAgo: 6, sparkline: [3, 2, 4, 3, 5, 4, 3],
    sampleFindings: [
      { text: "Security pending 72h on v2.14.0 (typical: 6h)", releaseId: "rel-v2140", timestamp: daysAgo(0.5) },
      { text: "Identity v2.13.8 Security review overdue 36h", releaseId: "rel-v2138", timestamp: daysAgo(1) },
      { text: "v2.15.0 has 5 pending gates — none approved yet", releaseId: "rel-v2150", timestamp: daysAgo(0.8) },
    ],
  },
  {
    id: "ag4", name: "Dependency Agent", watches: "Service graph", description: "Cross-service impact warnings",
    status: "Active", lastRanMinutesAgo: 8, sparkline: [1, 1, 2, 3, 2, 2, 3],
    sampleFindings: [
      { text: "v2.14.0 touches payments-api with 4 downstream dependents", releaseId: "rel-v2140", timestamp: daysAgo(1) },
      { text: "analytics-pipeline unstable — in v2.15.0 scope", releaseId: "rel-v2150", timestamp: daysAgo(0.6) },
      { text: "fraud-detection is Critical — included in v2.14.0", releaseId: "rel-v2140", timestamp: daysAgo(1.2) },
    ],
  },
  {
    id: "ag5", name: "Risk Agent", watches: "Release history", description: "Unusual pattern flags",
    status: "Active", lastRanMinutesAgo: 3, sparkline: [2, 4, 3, 5, 4, 6, 5],
    sampleFindings: [
      { text: "847 files changed on v2.14.0 — 3x team median", releaseId: "rel-v2140", timestamp: daysAgo(0.2) },
      { text: "Friday releases: 2x rollback rate vs weekday (6-month trend)", releaseId: undefined, timestamp: daysAgo(2) },
      { text: "v2.15.0 at 1203 files — largest release this quarter", releaseId: "rel-v2150", timestamp: daysAgo(0.4) },
    ],
  },
  {
    id: "ag6", name: "Summary Agent", watches: "All agents", description: "Daily plain-English digest",
    status: "Active", lastRanMinutesAgo: 1, sparkline: [1, 1, 1, 2, 1, 1, 1],
    sampleFindings: [
      { text: "Morning digest: 5 active releases, 2 at risk, 1 blocked", timestamp: daysAgo(0.05) },
      { text: "Weekly summary: 8 releases shipped, 2 rollbacks", timestamp: daysAgo(7) },
    ],
  },
  {
    id: "ag7", name: "Conversation Agent", watches: "All data", description: "Free-text Q&A with citations",
    status: "Active", lastRanMinutesAgo: 0, sparkline: [5, 8, 6, 10, 7, 9, 12],
    sampleFindings: [
      { text: "Answered 'Can we ship v2.14.0 tonight?'", releaseId: "rel-v2140", timestamp: daysAgo(0.01) },
      { text: "Answered 'Which team has most blockers?'", timestamp: daysAgo(0.5) },
      { text: "14 readiness questions answered today", timestamp: daysAgo(0.1) },
    ],
  },
];

export function getAllHistory() {
  return releases
    .flatMap((r) => r.history.map((h) => ({ ...h, releaseName: r.version, releaseId: r.id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getOrgContext() {
  return {
    releases: releases.map((r) => ({
      id: r.id,
      version: r.version,
      team: r.team,
      status: r.status,
      targetDate: r.targetDate,
      filesChanged: r.filesChanged,
      blockers: r.approvals.filter((a) => a.status === "Pending").map((a) => a.gate),
      buildStatus: r.build.status,
      openTickets: r.tickets.filter((t) => t.status !== "Done").length,
    })),
    historicalTrend,
    teams: TEAMS,
    services: services.map((s) => ({ id: s.id, name: s.name, criticality: s.criticality, unstable: s.unstable })),
    stats: {
      totalReleases: releases.length,
      atRisk: releases.filter((r) => r.status === "At Risk").length,
      blocked: releases.filter((r) => r.status === "Blocked").length,
      ready: releases.filter((r) => r.status === "Ready").length,
      shipped: releases.filter((r) => r.status === "Shipped").length,
    },
  };
}

export function getExecutiveContext(
  predictions: {
    version: string;
    shipSuccessPct: number;
    rollbackRiskPct: number;
    team: string;
  }[],
  portfolio: {
    activeCount: number;
    atRiskCount: number;
    avgReadiness: number;
    avgShipSuccess: number;
    highRollbackCount: number;
    shippingThisWeek: number;
  }
) {
  return {
    ...getOrgContext(),
    portfolio,
    mlPredictions: predictions.slice(0, 8),
    cabSessions: cabSessions.slice(0, 2),
  };
}
