import type {
  ActivityFeedItem,
  AgentMeta,
  Approval,
  Connector,
  HistoricalTrendPoint,
  Release,
  Service,
  TeamMember,
} from "./types";

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

const defaultApprovals = (
  overrides: Partial<Record<string, Partial<Approval>>> = {}
): Approval[] => {
  const gates = ["QA", "Security", "Database", "Business", "Change"] as const;
  return gates.map((gate) => ({
    gate,
    status: "Approved" as const,
    approver: "System",
    timestamp: daysAgo(5),
    ...(overrides[gate] ?? {}),
  }));
};

export const teamMembers: TeamMember[] = [
  { id: "u1", name: "Priya Sharma", role: "Release Manager", email: "priya@company.com" },
  { id: "u2", name: "Raj Patel", role: "DB Lead", email: "raj@company.com" },
  { id: "u3", name: "Sarah Chen", role: "Security Lead", email: "sarah@company.com" },
  { id: "u4", name: "Mike Torres", role: "QA Lead", email: "mike@company.com" },
  { id: "u5", name: "Alex Kim", role: "Engineering Manager", email: "alex@company.com" },
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
];

export const releases: Release[] = [
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
    typicalApprovalHours: { QA: 4, Security: 6, Database: 8, Business: 12, Change: 24 },
    commits: [
      { sha: "a3f9c2d", message: "Refactor payment routing logic", author: "Dev Team", timestamp: daysAgo(2) },
      { sha: "b7e1a04", message: "Add fraud detection hooks", author: "Dev Team", timestamp: daysAgo(1) },
    ],
    dependsOnServices: ["svc-payments", "svc-auth", "svc-gateway"],
    incidentHistory: [{ id: "inc-r1", date: daysAgo(90), severity: "Sev-2", summary: "Post-release latency on payments-api" }],
    tickets: [
      { id: "PLAT-4412", title: "Payment routing refactor", status: "Done", assignee: "Dev Team" },
      { id: "PLAT-4418", title: "Security review checklist", status: "In Progress", assignee: "Sarah Chen" },
    ],
    approvals: defaultApprovals({
      Security: { status: "Pending", approver: undefined, timestamp: undefined, pendingSince: daysAgo(3) },
      QA: { status: "Approved", approver: "Mike Torres", timestamp: daysAgo(1) },
      Database: { status: "Approved", approver: "Raj Patel", timestamp: daysAgo(2) },
    }),
    build: { id: "4471", status: "Passed", pipeline: "GitHub Actions", lastRun: daysAgo(0.5), testCount: 1240, passedTests: 1240 },
    notes: "Database migration needs maintenance window before ship.",
    history: [
      { id: "h1", timestamp: daysAgo(3), actor: "Mike Torres", action: "Approved QA gate", type: "human" },
      { id: "h2", timestamp: daysAgo(2), actor: "Risk Agent", action: "Flagged unusual file-change volume (847 files)", type: "agent", agent: "Risk Agent" },
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
    typicalApprovalHours: { QA: 4, Security: 6, Database: 8, Business: 12, Change: 24 },
    commits: [{ sha: "c4d8e91", message: "Fix invoice rounding bug", author: "Billing Team", timestamp: daysAgo(1) }],
    dependsOnServices: ["svc-billing", "svc-ledger"],
    incidentHistory: [],
    tickets: [{ id: "BILL-892", title: "Invoice rounding fix", status: "Done", assignee: "Billing Team" }],
    approvals: defaultApprovals({ QA: { status: "Pending", pendingSince: daysAgo(0.5) } }),
    build: { id: "4468", status: "Failed", pipeline: "GitHub Actions", lastRun: daysAgo(0.2), testCount: 320, passedTests: 298 },
    notes: "Build failed on integration tests — investigating.",
    history: [{ id: "h3", timestamp: daysAgo(0.2), actor: "Build Agent", action: "Build #4468 failed — 22 test failures", type: "agent", agent: "Build Agent" }],
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
    typicalApprovalHours: { QA: 4, Security: 6, Database: 8, Business: 12, Change: 24 },
    commits: [{ sha: "e5f2b33", message: "Elasticsearch index rebuild", author: "Search Team", timestamp: daysAgo(4) }],
    dependsOnServices: ["svc-search", "svc-cache", "svc-gateway"],
    incidentHistory: [],
    tickets: [
      { id: "SRCH-201", title: "Index rebuild", status: "In Progress", assignee: "Search Team" },
      { id: "SRCH-205", title: "Query performance tests", status: "Open", assignee: "Search Team" },
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
    history: [],
  },
  ...Array.from({ length: 22 }, (_, i) => {
    const n = i + 1;
    const shipped = i < 14;
    const teams = ["Platform", "Billing", "Search", "Payments", "Core"];
    const team = teams[i % teams.length];
    const dateOffset = shipped ? -(n * 7 + 3) : n * 4 + 10;
    return {
      id: `rel-gen-${n}`,
      name: `${team} Release`,
      version: `v2.${10 + Math.floor(n / 5)}.${n}`,
      team,
      owner: i % 2 === 0 ? "Priya Sharma" : "Alex Kim",
      targetDate: dateOffset < 0 ? daysAgo(-dateOffset) : daysFromNow(dateOffset),
      status: (shipped ? "Shipped" : n % 3 === 0 ? "At Risk" : "Scheduled") as Release["status"],
      decision: shipped ? ("Go" as const) : null,
      filesChanged: 50 + n * 23,
      typicalApprovalHours: { QA: 4, Security: 6, Database: 8, Business: 12, Change: 24 },
      commits: [{ sha: `${n}a1b2c3`, message: `Feature batch ${n}`, author: team, timestamp: daysAgo(n + 2) }],
      dependsOnServices: [services[n % services.length].id],
      incidentHistory: shipped && n % 5 === 0 ? [{ id: `inc-g${n}`, date: daysAgo(n * 7), severity: "Sev-3" as const, summary: "Minor rollback after release" }] : [],
      tickets: [{ id: `${team.slice(0, 3).toUpperCase()}-${1000 + n}`, title: `Story ${n}`, status: shipped ? "Done" as const : "In Progress" as const, assignee: team }],
      approvals: defaultApprovals(),
      build: { id: `${4400 + n}`, status: shipped ? "Passed" as const : "Passed" as const, pipeline: "GitHub Actions", lastRun: daysAgo(n), testCount: 500 + n * 10, passedTests: 500 + n * 10 },
      notes: "",
      history: [{ id: `hg${n}`, timestamp: daysAgo(n), actor: "Priya Sharma", action: `Created release v2.${10 + Math.floor(n / 5)}.${n}`, type: "human" as const }],
    } satisfies Release;
  }),
];

export const historicalTrend: HistoricalTrendPoint[] = Array.from({ length: 26 }, (_, i) => {
  const weekDate = new Date();
  weekDate.setDate(weekDate.getDate() - (25 - i) * 7);
  const week = weekDate.toISOString().slice(0, 10);
  const dip = i >= 8 && i <= 12;
  return {
    week,
    avgReadiness: dip ? 62 + (i - 8) * 3 : 78 + Math.sin(i / 3) * 8 + i * 0.3,
    rollbackCount: dip ? 4 - Math.abs(i - 10) : i % 4 === 0 ? 2 : i % 7 === 0 ? 1 : 0,
  };
});

export const connectors: Connector[] = [
  { id: "c1", name: "Jira", description: "Ticket tracker", status: "Connected", lastSynced: daysAgo(0.01), maskedToken: "jira_••••••••4f2a" },
  { id: "c2", name: "GitHub Actions", description: "CI/CD pipelines", status: "Connected", lastSynced: daysAgo(0.02), maskedToken: "ghp_••••••••9b1c" },
  { id: "c3", name: "Datadog", description: "Monitoring & APM", status: "Connected", lastSynced: daysAgo(0.05), maskedToken: "dd_••••••••7e3d" },
  { id: "c4", name: "ServiceNow", description: "Change management", status: "Connected", lastSynced: daysAgo(0.1), maskedToken: "sn_••••••••2a8f" },
  { id: "c5", name: "Snyk", description: "Security scanning", status: "Connected", lastSynced: daysAgo(0.08), maskedToken: "sk-••••••••1c4e" },
  { id: "c6", name: "Confluence", description: "Documentation", status: "Connected", lastSynced: daysAgo(0.15), maskedToken: "conf_••••••••6d9b" },
  { id: "c7", name: "Slack", description: "Notifications", status: "Connected", lastSynced: daysAgo(0.01), maskedToken: "xoxb-••••••••3f7a" },
  { id: "c8", name: "PagerDuty", description: "Incident correlation", status: "Connected", lastSynced: daysAgo(0.03), maskedToken: "pd_••••••••8e2c" },
];

export const activityFeed: ActivityFeedItem[] = [
  { id: "af1", timestamp: daysAgo(0.1), type: "human", actor: "Raj Patel", message: "Approved Database gate for v2.14.0", releaseId: "rel-v2140" },
  { id: "af2", timestamp: daysAgo(0.2), type: "agent", actor: "Risk Agent", agent: "Risk Agent", message: "Flagged unusual file-change volume on v2.14.0 (847 files vs ~280 median)", releaseId: "rel-v2140" },
  { id: "af3", timestamp: daysAgo(0.3), type: "human", actor: "Mike Torres", message: "Approved QA gate for v2.14.0", releaseId: "rel-v2140" },
  { id: "af4", timestamp: daysAgo(0.5), type: "agent", actor: "Build Agent", agent: "Build Agent", message: "Build #4468 failed for v2.13.5 — 22 integration test failures", releaseId: "rel-v2135" },
  { id: "af5", timestamp: daysAgo(1), type: "agent", actor: "Approval Agent", agent: "Approval Agent", message: "Security sign-off pending 72h on v2.14.0 (typical: 6h)", releaseId: "rel-v2140" },
  { id: "af6", timestamp: daysAgo(1.5), type: "human", actor: "Priya Sharma", message: "Created release v2.15.0", releaseId: "rel-v2150" },
  { id: "af7", timestamp: daysAgo(2), type: "agent", actor: "Dependency Agent", agent: "Dependency Agent", message: "v2.14.0 touches payments-api — 3 downstream services depend on it", releaseId: "rel-v2140" },
  { id: "af8", timestamp: daysAgo(3), type: "human", actor: "Sarah Chen", message: "Started Security review for v2.14.0", releaseId: "rel-v2140" },
];

export const agents: AgentMeta[] = [
  { id: "ag1", name: "Ticket Agent", watches: "Linked tickets/stories", description: "Flags stuck or reopened tickets", status: "Active", lastRanMinutesAgo: 4, sparkline: [2, 3, 1, 4, 2, 3, 5], sampleFindings: [{ text: "PLAT-4418 Security review still in progress", releaseId: "rel-v2140", timestamp: daysAgo(0.1) }] },
  { id: "ag2", name: "Build Agent", watches: "CI/CD connector", description: "Explains build failures in plain English", status: "Active", lastRanMinutesAgo: 2, sparkline: [1, 2, 5, 3, 2, 1, 4], sampleFindings: [{ text: "Build #4468 failed — invoice integration tests", releaseId: "rel-v2135", timestamp: daysAgo(0.2) }] },
  { id: "ag3", name: "Approval Agent", watches: "Approval checklist", description: "Nudges overdue sign-offs", status: "Active", lastRanMinutesAgo: 6, sparkline: [3, 2, 4, 3, 5, 4, 3], sampleFindings: [{ text: "Security pending 72h on v2.14.0", releaseId: "rel-v2140", timestamp: daysAgo(0.5) }] },
  { id: "ag4", name: "Dependency Agent", watches: "Service graph", description: "Cross-service impact warnings", status: "Active", lastRanMinutesAgo: 8, sparkline: [1, 1, 2, 3, 2, 2, 3], sampleFindings: [{ text: "v2.14.0 touches payments-api with 3 dependents", releaseId: "rel-v2140", timestamp: daysAgo(1) }] },
  { id: "ag5", name: "Risk Agent", watches: "Release history", description: "Unusual pattern flags", status: "Active", lastRanMinutesAgo: 3, sparkline: [2, 4, 3, 5, 4, 6, 5], sampleFindings: [{ text: "847 files changed — 3x team median", releaseId: "rel-v2140", timestamp: daysAgo(0.2) }] },
  { id: "ag6", name: "Summary Agent", watches: "All agents", description: "Daily plain-English digest", status: "Active", lastRanMinutesAgo: 1, sparkline: [1, 1, 1, 2, 1, 1, 1], sampleFindings: [{ text: "Generated morning summary for 3 active releases", timestamp: daysAgo(0.05) }] },
  { id: "ag7", name: "Conversation Agent", watches: "All data", description: "Free-text Q&A with citations", status: "Active", lastRanMinutesAgo: 0, sparkline: [5, 8, 6, 10, 7, 9, 12], sampleFindings: [{ text: "Answered 'Can we ship v2.14.0 tonight?'", releaseId: "rel-v2140", timestamp: daysAgo(0.01) }] },
];

export function getAllHistory() {
  return releases.flatMap((r) =>
    r.history.map((h) => ({ ...h, releaseName: r.version, releaseId: r.id }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getOrgContext() {
  return {
    releases: releases.map((r) => ({
      id: r.id, version: r.version, team: r.team, status: r.status,
      targetDate: r.targetDate, filesChanged: r.filesChanged,
      blockers: r.approvals.filter((a) => a.status === "Pending").map((a) => a.gate),
      buildStatus: r.build.status,
    })),
    historicalTrend,
    stats: { totalReleases: releases.length, atRisk: releases.filter((r) => r.status === "At Risk").length },
  };
}
