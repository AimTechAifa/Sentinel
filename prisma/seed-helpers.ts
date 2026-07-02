import * as xlsx from "xlsx";

export type Row = Record<string, unknown>;
export type SkippedRow = { sheet: string; row: number; reason: string };

export const APP_NAME_ALIASES: Record<string, string> = {
  "SAP S/4HANA Finance": "SAP S/4HANA Finance (FICO)",
  // System Mapping's "Core Systems Hub" names these generically (department is
  // multi-value, e.g. "Finance / Manufacturing") — map to a representative
  // per-department application row rather than inventing a new application.
  "SAP S/4HANA (ERP)": "SAP S/4HANA Finance (FICO)",
  "Salesforce CRM": "Salesforce Sales Cloud",
};

export const VALID_ENVS = new Set(["Dev", "Test", "UAT", "Pre-prod", "Prod", "DR"]);

export const EXPECTED_COUNTS: Record<string, number> = {
  departments: 8,
  users: 100,
  releaseManagersEnriched: 12,
  superAdmins: 12,
  applications: 84,
  environments: 504,
  riskFactorDefinitions: 46,
  releases: 80,
  envBookings: 80,
  risks: 31,
  drifts: 7,
  approvals: 27,
  calendarEvents: 166,
  releaseDependencies: 26,
  leaveRecords: 30,
  environmentVersions: 180,
  systemIntegrations: 4,
  monitoringAlerts: 40,
  incidents: 18,
  plannedMaintenance: 20,
  applicationStatusChecks: 36,
};

export function resolveAppName(name: string): string {
  const trimmed = name.trim();
  return APP_NAME_ALIASES[trimmed] ?? trimmed;
}

export function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

export function strOrNull(v: unknown): string | null {
  const s = str(v);
  return s ? s : null;
}

export function excelDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    const d = xlsx.SSF.parse_date_code(v);
    if (!d) return null;
    return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, d.S || 0));
  }
  const parsed = new Date(String(v));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function excelTimeToHHMM(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number") {
    const totalMins = Math.round(v * 24 * 60);
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const s = str(v);
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return s;
}

export function isConflictFlag(v: unknown): boolean {
  return str(v).length > 0;
}

export function percentFromDecimal(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (Number.isNaN(n)) return null;
  return n <= 1 ? n * 100 : n;
}

export function splitIds(v: unknown): string[] {
  if (v == null || v === "") return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function sheetRows(wb: xlsx.WorkBook, sheetName: string): unknown[][] {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
  return xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
}

export function findHeaderRow(rows: unknown[][], requiredHeaders: string[], maxScan = 25): number {
  const normalized = requiredHeaders.map((h) => h.toLowerCase());
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const row = rows[i] ?? [];
    const cells = row.map((c) => str(c).toLowerCase());
    if (normalized.every((h) => cells.includes(h))) return i;
  }
  throw new Error(`Header row not found for: ${requiredHeaders.join(", ")}`);
}

export function findHeaderRowContains(rows: unknown[][], needle: string, maxScan = 80): number {
  const n = needle.toLowerCase();
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const row = rows[i] ?? [];
    if (row.some((c) => str(c).toLowerCase() === n)) return i;
  }
  throw new Error(`Header row not found containing: ${needle}`);
}

export function rowsToObjects(rows: unknown[][], headerRowIndex: number): Row[] {
  const headers = (rows[headerRowIndex] ?? []).map((h) => str(h));
  const out: Row[] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    if (row.every((c) => c == null || str(c) === "")) continue;
    const obj: Row = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = row[idx] ?? null;
    });
    out.push(obj);
  }
  return out;
}

export function filterByIdRegex(rows: Row[], idColumn: string, regex: RegExp): Row[] {
  return rows.filter((r) => regex.test(str(r[idColumn])));
}

export function forwardFill(rows: Row[], columns: string[]): Row[] {
  const last: Record<string, unknown> = {};
  return rows.map((row) => {
    const next = { ...row };
    for (const col of columns) {
      if (str(next[col])) last[col] = next[col];
      else if (last[col] != null) next[col] = last[col];
    }
    return next;
  });
}

export function isRealDate(v: unknown): boolean {
  return excelDate(v) != null;
}

export function storeAsString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  return str(v);
}

export function parseFloatOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isNaN(n) ? null : n;
}

export function parseIntOrZero(v: unknown): number {
  const n = parseInt(String(v ?? "0"), 10);
  return Number.isNaN(n) ? 0 : n;
}
