import { releases as demoReleases } from "@/lib/dummy-data";
import { inPeriod, periodRange, type Period } from "@/lib/period-range";
import type { SearchResult } from "@/lib/dummy-data";

export type DataSource = "database" | "demo";

export type UnifiedRelease = {
  id: string;
  code: string;
  name: string;
  status: string;
  owner: string;
  group: string;
  date: string;
  source: DataSource;
  href: string;
  priority?: string;
};

type DbRelease = {
  id: string;
  releaseCode: string;
  name: string;
  status: string;
  owner: string;
  releaseDate: string | Date;
  priority: string;
  department: { name: string };
};

export function demoToUnified(r: (typeof demoReleases)[0]): UnifiedRelease {
  return {
    id: r.id,
    code: r.version,
    name: r.name,
    status: r.status,
    owner: r.owner,
    group: r.team,
    date: r.targetDate,
    source: "demo",
    href: `/releases/${r.id}`,
  };
}

export function dbToUnified(r: DbRelease): UnifiedRelease {
  return {
    id: r.id,
    code: r.releaseCode,
    name: r.name,
    status: r.status,
    owner: r.owner,
    group: r.department.name,
    date: typeof r.releaseDate === "string" ? r.releaseDate : r.releaseDate.toISOString(),
    source: "database",
    href: `/releases/${r.id}`,
    priority: r.priority,
  };
}

export function getDemoReleasesInPeriod(period: Period, anchor = new Date()): UnifiedRelease[] {
  return demoReleases
    .filter((r) => inPeriod(r.targetDate, period, anchor))
    .map(demoToUnified)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function mergeReleases(db: UnifiedRelease[], demo: UnifiedRelease[]): UnifiedRelease[] {
  const seen = new Set<string>();
  const merged: UnifiedRelease[] = [];
  for (const r of [...db, ...demo].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
    const key = `${r.source}:${r.code.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(r);
  }
  return merged;
}

export function countByStatus(rows: UnifiedRelease[]) {
  return {
    planned: rows.filter((r) => r.status === "Planned" || r.status === "Scheduled").length,
    inProgress: rows.filter((r) => r.status === "In Progress" || r.status === "Ready").length,
    blocked: rows.filter((r) => r.status === "Blocked").length,
    atRisk: rows.filter((r) => r.status === "At Risk").length,
    total: rows.length,
  };
}

export function dbReleaseToSearchResult(r: {
  id: string;
  releaseCode: string;
  name: string;
  status: string;
  department: { name: string };
}): SearchResult {
  return {
    id: `db-rel-${r.id}`,
    type: "release",
    label: `${r.releaseCode} — ${r.name}`,
    sublabel: `${r.department.name} · ${r.status} · Database`,
    href: `/releases/${r.id}`,
  };
}

export function demoReleaseMatchesQuery(r: (typeof demoReleases)[0], q: string) {
  const lower = q.toLowerCase();
  return (
    r.version.toLowerCase().includes(lower) ||
    r.name.toLowerCase().includes(lower) ||
    r.team.toLowerCase().includes(lower) ||
    r.owner.toLowerCase().includes(lower) ||
    r.id.toLowerCase().includes(lower)
  );
}

/** Maps synthetic demo teams to Release Desk department names. */
export const DEMO_TEAM_DEPARTMENT: Record<string, string> = {
  Platform: "Platform",
  Billing: "FIN",
  Search: "CRM",
  Payments: "Platform",
  Core: "Platform",
  Identity: "Security",
  Mobile: "CRM",
  Data: "Operations",
};

/** Primary applications touched by each demo team (for app/env filters). */
export const DEMO_TEAM_APPLICATIONS: Record<string, string[]> = {
  Platform: ["SAP"],
  Billing: ["FIN"],
  Search: ["CRM"],
  Payments: ["SAP"],
  Core: ["SAP"],
  Identity: ["SAP"],
  Mobile: ["CRM"],
  Data: ["Oracle"],
};

export type ReleaseListFilters = {
  departmentId?: string;
  applicationId?: string;
  environmentId?: string;
};

export function demoReleaseMatchesFilters(
  r: (typeof demoReleases)[0],
  filters: ReleaseListFilters,
  departments: { id: string; name: string }[],
  applications: { id: string; name: string }[],
  environments: { id: string; application: { name: string } }[]
): boolean {
  if (filters.departmentId) {
    const dept = departments.find((d) => d.id === filters.departmentId);
    if (!dept) return false;
    const mapped = DEMO_TEAM_DEPARTMENT[r.team] ?? r.team;
    if (mapped !== dept.name && r.team !== dept.name) return false;
  }
  if (filters.applicationId) {
    const app = applications.find((a) => a.id === filters.applicationId);
    if (!app) return false;
    const names = DEMO_TEAM_APPLICATIONS[r.team] ?? [];
    if (!names.includes(app.name)) return false;
  }
  if (filters.environmentId) {
    const env = environments.find((e) => e.id === filters.environmentId);
    if (!env) return false;
    const names = DEMO_TEAM_APPLICATIONS[r.team] ?? [];
    if (!names.includes(env.application.name)) return false;
  }
  return true;
}

export { periodRange, type Period };
