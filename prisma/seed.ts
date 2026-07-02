/**
 * Multi-tenant seed — ReleaseDesk V0.4 workbook.
 *
 * 1. Creates the sentinel global org (isSystemGlobal = true, slug "system-global").
 * 2. Seeds every system-default template table under the sentinel org with
 *    isSystemDefault = true (parsed from the workbook's Reference Data +
 *    Risk Factors sheets).
 * 3. Creates the demo org "Acme Corp Demo".
 * 4. Seeds the V0.4 workbook data under the demo org.
 * 5. Calls cloneSystemDefaultsToOrg(demoOrg) — the same function the
 *    onboarding wizard uses — so that path is exercised by the seed itself.
 *
 * Run: npm run db:seed
 */
import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";
import { prisma } from "../lib/prisma";
import { cloneSystemDefaultsToOrg, SENTINEL_ORG_SLUG } from "../lib/system-defaults";
import {
  EXPECTED_COUNTS,
  Row,
  SkippedRow,
  VALID_ENVS,
  excelDate,
  excelTimeToHHMM,
  filterByIdRegex,
  findHeaderRow,
  findHeaderRowContains,
  forwardFill,
  isConflictFlag,
  isRealDate,
  parseFloatOrNull,
  parseIntOrZero,
  percentFromDecimal,
  resolveAppName,
  rowsToObjects,
  sheetRows,
  splitIds,
  storeAsString,
  str,
} from "./seed-helpers";

const XLSX_PATH = path.join(
  process.cwd(),
  "prisma",
  "seed-data",
  "ReleaseDesk_SampleData_V0_4_29062026.xlsx"
);

const DEMO_ORG = { name: "Acme Corp Demo", slug: "acme-corp-demo" };

const skipped: SkippedRow[] = [];
const counts: Record<string, number> = {};

function skip(sheet: string, row: number, reason: string) {
  skipped.push({ sheet, row, reason });
  console.warn(`[SKIP] ${sheet} row ${row}: ${reason}`);
}

function bump(key: string, n = 1) {
  counts[key] = (counts[key] ?? 0) + n;
}

function loadWorkbook(): xlsx.WorkBook {
  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(
      `Workbook not found at ${XLSX_PATH}. Copy ReleaseDesk_SampleData_V0_4_29062026.xlsx into prisma/seed-data/.`
    );
  }
  return xlsx.readFile(XLSX_PATH);
}

// ─────────────────────────────────────────────────────────────────────
// Reference Data sheet — vertically stacked numbered sections.
// Each section: a title row ("7. RISK SCORE THRESHOLDS"), a header row,
// then data rows until the next blank/title row.
// ─────────────────────────────────────────────────────────────────────

function refSection(rows: unknown[][], titlePrefix: string): Row[] {
  let titleIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const first = str((rows[i] ?? [])[0]);
    if (first.toUpperCase().startsWith(titlePrefix.toUpperCase())) {
      titleIdx = i;
      break;
    }
  }
  if (titleIdx === -1) throw new Error(`Reference Data section not found: ${titlePrefix}`);

  const headerIdx = titleIdx + 1;
  const headers = (rows[headerIdx] ?? []).map((h) => str(h));
  const out: Row[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const cells = row.map((c) => str(c));
    if (cells.every((c) => !c)) break; // blank row ends the section
    if (/^\d+\.\s/.test(cells[0])) break; // next numbered section
    const obj: Row = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = row[idx] ?? null;
    });
    out.push(obj);
  }
  return out;
}

function parseScoreRange(range: string): { min: number; max: number } {
  const s = range.replace(/[≥ΓëÑ]/g, ">=").trim();
  const between = s.match(/^([\d.]+)\s*-\s*([\d.]+)$/);
  if (between) return { min: parseFloat(between[1]), max: parseFloat(between[2]) };
  const lt = s.match(/^<\s*([\d.]+)$/);
  if (lt) return { min: 0, max: parseFloat(lt[1]) };
  const gte = s.match(/^>=\s*([\d.]+)$/);
  if (gte) return { min: parseFloat(gte[1]), max: 999 };
  return { min: 0, max: 999 };
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** "Dec 13 - Dec 31" -> concrete dates in the current year; null when not parseable. */
function parseFreezeTiming(timing: string): { start: Date; end: Date } | null {
  const m = timing.match(/^([A-Za-z]{3})\w*\s+(\d{1,2})\s*-\s*([A-Za-z]{3})\w*\s+(\d{1,2})$/);
  if (!m) return null;
  const year = new Date().getFullYear();
  const startMonth = MONTHS[m[1].toLowerCase()];
  const endMonth = MONTHS[m[3].toLowerCase()];
  if (startMonth === undefined || endMonth === undefined) return null;
  return {
    start: new Date(Date.UTC(year, startMonth, parseInt(m[2], 10))),
    end: new Date(Date.UTC(year, endMonth, parseInt(m[4], 10))),
  };
}

const STATUS_SYSTEM_TAGS: Record<string, string> = {
  DRAFT: "DRAFT",
  SUBMITTED: "IN_REVIEW",
  PENDING_CAB: "IN_REVIEW",
  APPROVED: "APPROVED",
  IN_PROGRESS: "APPROVED",
  BLOCKED: "BLOCKED",
  ON_HOLD: "BLOCKED",
  COMPLETED: "TERMINAL_SUCCESS",
  FAILED: "TERMINAL_FAILURE",
  CANCELLED: "TERMINAL_CANCELLED",
};

function yesNo(v: unknown): boolean {
  return str(v).toLowerCase() === "yes";
}

// ─────────────────────────────────────────────────────────────────────
// System default templates → sentinel org (isSystemDefault = true)
// ─────────────────────────────────────────────────────────────────────

async function seedSystemDefaults(wb: xlsx.WorkBook, orgId: string) {
  const ref = sheetRows(wb, "Reference Data");
  const sys = { organizationId: orgId, isSystemDefault: true };

  // §2 Environments → EnvironmentTypeDefinition
  for (const r of refSection(ref, "2. ENVIRONMENTS")) {
    const envCode = str(r["Env Code"]);
    if (!envCode) continue;
    await prisma.environmentTypeDefinition.upsert({
      where: { organizationId_envCode: { organizationId: orgId, envCode } },
      create: {
        ...sys,
        envCode,
        envName: str(r["Env Name"]),
        promotionOrder: parseIntOrZero(r["Promotion Order"]),
        availability: str(r["Availability"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:environmentTypes");
  }

  // §3 Release sizes → ReleaseSizeDefinition
  for (const r of refSection(ref, "3. RELEASE SIZES")) {
    const size = str(r["Size"]);
    if (!size) continue;
    await prisma.releaseSizeDefinition.upsert({
      where: { organizationId_size: { organizationId: orgId, size } },
      create: {
        ...sys,
        size,
        testDays: parseIntOrZero(r["Test Days"]),
        uatDays: parseIntOrZero(r["UAT Days"]),
        preProdDays: parseIntOrZero(r["Pre-Prod Days"]),
        totalLeadTime: str(r["Total Lead Time"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:releaseSizes");
  }

  // §6 Release status codes → WorkflowStageDefinition (entityType "Release")
  let stageSeq = 1;
  for (const r of refSection(ref, "6. RELEASE STATUS CODES")) {
    const stageCode = str(r["Status Code"]);
    if (!stageCode) continue;
    await prisma.workflowStageDefinition.upsert({
      where: {
        organizationId_entityType_stageCode: {
          organizationId: orgId,
          entityType: "Release",
          stageCode,
        },
      },
      create: {
        ...sys,
        entityType: "Release",
        stageCode,
        displayName: str(r["Display Name"]),
        stage: str(r["Stage"]) || null,
        sequence: stageSeq,
        systemTag: STATUS_SYSTEM_TAGS[stageCode] ?? "DRAFT",
        description: str(r["Description"]) || null,
      },
      update: { isSystemDefault: true },
    });
    stageSeq++;
    bump("tpl:workflowStages");
  }

  // §7 Risk score thresholds → RiskScoreThreshold
  for (const r of refSection(ref, "7. RISK SCORE THRESHOLDS")) {
    const riskLevel = str(r["Risk Level"]);
    if (!riskLevel) continue;
    const range = parseScoreRange(str(r["Score Range"]));
    await prisma.riskScoreThreshold.upsert({
      where: { organizationId_riskLevel: { organizationId: orgId, riskLevel } },
      create: {
        ...sys,
        riskLevel,
        minScore: range.min,
        maxScore: range.max,
        colorCode: str(r["Color Code"]) || null,
        actionRequired: str(r["Action Required"]) || null,
        approvalLevel: str(r["Approval Level"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:riskThresholds");
  }

  // §8 Approval types → ApprovalTypeDefinition
  for (const r of refSection(ref, "8. APPROVAL TYPES")) {
    const code = str(r["Code"]);
    if (!code) continue;
    await prisma.approvalTypeDefinition.upsert({
      where: { organizationId_code: { organizationId: orgId, code } },
      create: {
        ...sys,
        approvalType: str(r["Approval Type"]),
        code,
        approverRoleCode: str(r["Approver Role"]) || null,
        slaHours: parseIntOrZero(r["SLA (Hours)"]) || null,
        sequence: parseIntOrZero(r["Sequence"]),
        systemTag: code === "FINAL" ? "FINAL" : null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:approvalTypes");
  }

  // §12 User roles → RoleDefinition
  for (const r of refSection(ref, "12. USER ROLES")) {
    const code = str(r["Code"]);
    if (!code) continue;
    await prisma.roleDefinition.upsert({
      where: { organizationId_code: { organizationId: orgId, code } },
      create: {
        ...sys,
        roleName: str(r["Role"]),
        code,
        canCreateRelease: yesNo(r["Create Release"]),
        canApprove: yesNo(r["Approve"]),
        isAdmin: yesNo(r["Admin"]),
        departmentScoped: !yesNo(r["Admin"]),
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:roles");
  }

  // §14 Change freeze periods → ChangeFreezePeriod (no unique key in schema —
  // delete this org's system rows first to stay idempotent)
  await prisma.changeFreezePeriod.deleteMany({ where: { organizationId: orgId } });
  for (const r of refSection(ref, "14. CHANGE FREEZE PERIODS")) {
    const periodName = str(r["Period"]);
    if (!periodName) continue;
    const dates = parseFreezeTiming(str(r["Timing"]));
    if (!dates) {
      skip("Reference Data §14", 0, `Unparseable freeze timing for "${periodName}": ${r["Timing"]}`);
      continue;
    }
    await prisma.changeFreezePeriod.create({
      data: {
        ...sys,
        periodName,
        freezeType: str(r["Type"]),
        startDate: dates.start,
        endDate: dates.end,
        exceptions: str(r["Exceptions"]) || null,
      },
    });
    bump("tpl:changeFreezes");
  }

  // Risk Factors sheet → RiskFactorDefinition (the 44 weighted factors).
  // The table ends at the first fully blank row (a "WEIGHT SUMMARY" table with
  // a colliding "Category" header follows it) and Category is only present on
  // the first factor of each group, so forward-fill it.
  // Wipe first: an earlier mis-parse may have left extra rows and upsert alone
  // would never remove them. Recreating is safe — clones dedupe by natural key.
  await prisma.riskFactorDefinition.deleteMany({ where: { organizationId: orgId } });
  const riskRows = sheetRows(wb, "Risk Factors");
  const factorHeaderIdx = findHeaderRowContains(riskRows, "Category", 70);
  const factorHeaders = (riskRows[factorHeaderIdx] ?? []).map((h) => str(h));
  const factorRows: Row[] = [];
  let currentCategory = "";
  for (let i = factorHeaderIdx + 1; i < riskRows.length; i++) {
    const raw = riskRows[i] ?? [];
    if (raw.every((c) => c == null || str(c) === "")) break; // blank row = end of factor table
    const obj: Row = {};
    factorHeaders.forEach((h, idx) => {
      if (h) obj[h] = raw[idx] ?? null;
    });
    if (str(obj["Category"])) currentCategory = str(obj["Category"]);
    obj["Category"] = currentCategory;
    const factorName = str(obj["Factor Name"]);
    if (!currentCategory || !factorName) continue;
    if (currentCategory.toUpperCase() === "TOTAL" || factorName.toUpperCase() === "TOTAL") continue;
    if (parseFloatOrNull(obj["Weight"]) == null) continue;
    factorRows.push(obj);
  }
  for (const f of factorRows) {
    const category = str(f["Category"]);
    const factorName = str(f["Factor Name"]);
    await prisma.riskFactorDefinition.upsert({
      where: {
        organizationId_category_factorName: { organizationId: orgId, category, factorName },
      },
      create: {
        ...sys,
        category,
        factorName,
        weight: parseFloatOrNull(f["Weight"])!,
        description: str(f["Description"]) || null,
        scoreBest: str(f["Score 1 (Best)"] || f["Score Best"]) || null,
        scoreWorst: str(f["Score 5 (Worst)"] || f["Score Worst"]) || null,
        dataSource: str(f["Data Source"]) || null,
      },
      update: { isSystemDefault: true, weight: parseFloatOrNull(f["Weight"])! },
    });
    bump("tpl:riskFactors");
  }

  // §16 Shared environments → SharedEnvironmentConfig
  for (const r of refSection(ref, "16. SHARED ENVIRONMENTS")) {
    const environmentName = str(r["Environment"]);
    if (!environmentName) continue;
    await prisma.sharedEnvironmentConfig.upsert({
      where: {
        organizationId_environmentName: { organizationId: orgId, environmentName },
      },
      create: {
        ...sys,
        environmentName,
        maxConcurrent: parseIntOrZero(r["Max Concurrent"]) || 1,
        contentionLevel: str(r["Contention Level"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:sharedEnvironments");
  }

  // §18 Risk likelihood scale → RiskLikelihoodScale
  for (const r of refSection(ref, "18. RISK LIKELIHOOD SCALE")) {
    const score = parseIntOrZero(r["Score"]);
    if (!score) continue;
    await prisma.riskLikelihoodScale.upsert({
      where: { organizationId_score: { organizationId: orgId, score } },
      create: {
        ...sys,
        score,
        label: str(r["Level"]),
        probabilityRange: str(r["Probability"]) || null,
        description: str(r["Description"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:likelihoodScale");
  }

  // §19 Risk impact scale → RiskImpactScale
  for (const r of refSection(ref, "19. RISK IMPACT SCALE")) {
    const score = parseIntOrZero(r["Score"]);
    if (!score) continue;
    await prisma.riskImpactScale.upsert({
      where: { organizationId_score: { organizationId: orgId, score } },
      create: {
        ...sys,
        score,
        label: str(r["Level"]),
        businessImpactRange: str(r["Business Impact"]) || null,
        description: str(r["Description"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:impactScale");
  }

  // §20 Application categories → ApplicationCategoryDefinition
  for (const r of refSection(ref, "20. APPLICATION CATEGORIES")) {
    const category = str(r["Category"]);
    if (!category) continue;
    await prisma.applicationCategoryDefinition.upsert({
      where: { organizationId_category: { organizationId: orgId, category } },
      create: {
        ...sys,
        category,
        tier: str(r["Tier"]) || null,
        criticality: str(r["Criticality"]) || null,
        exampleApps: str(r["Example Applications"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:appCategories");
  }

  // §21 Notification types → NotificationTypeDefinition
  for (const r of refSection(ref, "21. NOTIFICATION TYPES")) {
    const triggerEvent = str(r["Trigger"]);
    if (!triggerEvent) continue;
    await prisma.notificationTypeDefinition.upsert({
      where: {
        organizationId_triggerEvent: { organizationId: orgId, triggerEvent },
      },
      create: {
        ...sys,
        triggerEvent,
        recipients: splitIds(r["Recipients"]),
        channels: splitIds(r["Channel"]),
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:notificationTypes");
  }

  // §22 Testing phases → TestingPhaseGate
  let gateSeq = 1;
  for (const r of refSection(ref, "22. TESTING PHASES")) {
    const phaseName = str(r["Phase"]);
    if (!phaseName) continue;
    await prisma.testingPhaseGate.upsert({
      where: { organizationId_phaseName: { organizationId: orgId, phaseName } },
      create: {
        ...sys,
        phaseName,
        environmentName: str(r["Environment"]) || null,
        entryCriteria: str(r["Entry Criteria"]) || null,
        exitCriteria: str(r["Exit Criteria"]) || null,
        signOffRoleCode: str(r["Sign-off Required"]) || null,
        sequence: gateSeq,
      },
      update: { isSystemDefault: true },
    });
    gateSeq++;
    bump("tpl:testingGates");
  }

  // §23 Deployment windows → DeploymentWindowDefinition
  for (const r of refSection(ref, "23. DEPLOYMENT WINDOWS")) {
    const windowName = str(r["Window"]);
    if (!windowName) continue;
    const durationMatch = str(r["Duration"]).match(/([\d.]+)/);
    await prisma.deploymentWindowDefinition.upsert({
      where: { organizationId_windowName: { organizationId: orgId, windowName } },
      create: {
        ...sys,
        windowName,
        day: str(r["Day"]) || null,
        timeRange: str(r["Time (Local)"]) || null,
        durationHours: durationMatch ? parseFloat(durationMatch[1]) : null,
        suitableFor: str(r["Suitable For"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:deploymentWindows");
  }

  // §24 SLA metrics → SLAMetricDefinition
  for (const r of refSection(ref, "24. SLA METRICS")) {
    const metricName = str(r["Metric"]);
    if (!metricName) continue;
    await prisma.sLAMetricDefinition.upsert({
      where: { organizationId_metricName: { organizationId: orgId, metricName } },
      create: {
        ...sys,
        metricName,
        target: storeAsString(r["Target"]),
        warning: storeAsString(r["Warning"]),
        critical: storeAsString(r["Critical"]),
        measurementFrequency: str(r["Measurement"]) || null,
      },
      update: { isSystemDefault: true },
    });
    bump("tpl:slaMetrics");
  }
}

// ─────────────────────────────────────────────────────────────────────
// Workbook data → demo org
// ─────────────────────────────────────────────────────────────────────

function parseDepartments(wb: xlsx.WorkBook) {
  const ref = sheetRows(wb, "Reference Data");
  return refSection(ref, "1. DEPARTMENTS").filter((r) => str(r["Dept Name"]));
}

function parseApplications(wb: xlsx.WorkBook) {
  const rows = sheetRows(wb, "Applications");
  const headerIdx = findHeaderRow(rows, ["Department", "Application", "Env"], 5);
  const raw = rowsToObjects(rows, headerIdx);
  const filled = forwardFill(raw, ["Department", "Application Owner", "Tech Lead", "Application"]);
  const apps = new Map<
    string,
    {
      department: string;
      application: string;
      applicationOwner: string;
      techLead: string;
      environments: { env: string; envOwner: string }[];
    }
  >();

  for (const r of filled) {
    const department = str(r["Department"]);
    const application = str(r["Application"]);
    const env = str(r["Env"]);
    if (!department || !application || !env) continue;
    const key = `${department}::${application}`;
    if (!apps.has(key)) {
      apps.set(key, {
        department,
        application,
        applicationOwner: str(r["Application Owner"]),
        techLead: str(r["Tech Lead"]),
        environments: [],
      });
    }
    const entry = apps.get(key)!;
    if (str(r["Application Owner"])) entry.applicationOwner = str(r["Application Owner"]);
    if (str(r["Tech Lead"])) entry.techLead = str(r["Tech Lead"]);
    entry.environments.push({ env, envOwner: str(r["Env Owner"]) });
  }
  return [...apps.values()];
}

function parseSheetWithId(
  wb: xlsx.WorkBook,
  sheetName: string,
  requiredHeaders: string[],
  idColumn: string,
  regex: RegExp,
  maxHeaderScan = 25
): Row[] {
  const rows = sheetRows(wb, sheetName);
  const headerIdx = findHeaderRow(rows, requiredHeaders, maxHeaderScan);
  const objects = rowsToObjects(rows, headerIdx);
  return filterByIdRegex(objects, idColumn, regex);
}

async function seedDemoOrgData(wb: xlsx.WorkBook, orgId: string) {
  const deptIdByName = new Map<string, string>();
  const appIdByKey = new Map<string, string>();
  const appIdByName = new Map<string, string>();
  const envIdByAppEnv = new Map<string, string>();
  const userDbIdByUserId = new Map<string, string>();
  const userDbIdByEmail = new Map<string, string>();
  const userNameByUserId = new Map<string, string>();
  const releaseIdByCode = new Map<string, string>();
  const releaseOwnerNameByCode = new Map<string, string>();

  function lookupAppId(appName: string, departmentName?: string, sheet = "?", row = 0): string | null {
    const resolved = resolveAppName(appName);
    if (departmentName) {
      const key = `${departmentName}::${resolved}`;
      if (appIdByKey.has(key)) return appIdByKey.get(key)!;
    }
    const id = appIdByName.get(resolved);
    if (!id) {
      skip(sheet, row, `Application not found: "${appName}" (resolved: "${resolved}")`);
      return null;
    }
    return id;
  }

  // 1. Departments (Reference Data §1 — Dept Code / Dept Name / Primary Focus)
  for (const d of parseDepartments(wb)) {
    const name = str(d["Dept Name"]);
    const rec = await prisma.department.upsert({
      where: { organizationId_name: { organizationId: orgId, name } },
      create: {
        organizationId: orgId,
        name,
        deptCode: str(d["Dept Code"]) || null,
        head: "",
        primaryFocus: str(d["Primary Focus"]) || null,
      },
      update: {
        deptCode: str(d["Dept Code"]) || null,
        primaryFocus: str(d["Primary Focus"]) || null,
      },
    });
    deptIdByName.set(name, rec.id);
    bump("departments");
  }

  // 2. Users
  const users = parseSheetWithId(wb, "Users", ["User ID", "Name", "Email"], "User ID", /^USR-\d+$/);
  for (const u of users) {
    const email = str(u["Email"]).toLowerCase();
    const data = {
      name: str(u["Name"]),
      email: str(u["Email"]),
      role: str(u["Role"]),
      department: str(u["Department"]),
      manager: str(u["Manager"]) || null,
      accessLevel: str(u["Access Level"]),
      status: str(u["Status"]),
      lastLogin: excelDate(u["Last Login"]),
    };
    const rec = await prisma.user.upsert({
      where: {
        organizationId_userId: { organizationId: orgId, userId: str(u["User ID"]) },
      },
      create: { organizationId: orgId, userId: str(u["User ID"]), ...data },
      update: data,
    });
    userDbIdByUserId.set(str(u["User ID"]), rec.id);
    userDbIdByEmail.set(email, rec.id);
    userNameByUserId.set(str(u["User ID"]), str(u["Name"]));
    bump("users");
  }

  // 2b. Enrich Release Managers (same people as Users — match by email)
  const rms = parseSheetWithId(wb, "Admin (Release Managers)", ["ID", "Name", "Email"], "ID", /^RM-\d+$/);
  for (const rm of rms) {
    const email = str(rm["Email"]).toLowerCase();
    const userId = userDbIdByEmail.get(email);
    if (!userId) {
      skip("Admin (Release Managers)", 0, `No User found for RM email: ${rm["Email"]}`);
      continue;
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        region: str(rm["Region"]) || null,
        phone: str(rm["Phone"]) || null,
        specialization: str(rm["Specialization"]) || null,
        rmStartDate: excelDate(rm["Start Date"]),
      },
    });
    bump("releaseManagersEnriched");
  }

  // 2c. Super Admins (separate entity; linked to User when email matches)
  const sas = parseSheetWithId(wb, "Super Admins", ["Admin ID", "Name", "Email"], "Admin ID", /^SA-\d+$/);
  for (const sa of sas) {
    const email = str(sa["Email"]).toLowerCase();
    const linkedUserId = userDbIdByEmail.get(email) ?? null;
    const data = {
      name: str(sa["Name"]),
      email: str(sa["Email"]),
      title: str(sa["Title"]) || null,
      departmentName: str(sa["Department"]) || null,
      accessScope: str(sa["Access Scope"]) || null,
      grantedDate: excelDate(sa["Granted Date"]),
      grantedBy: str(sa["Granted By"]) || null,
      status: str(sa["Status"]) || null,
      expiryDate: excelDate(sa["Expiry Date"]),
      notes: str(sa["Notes"]) || null,
      linkedUserId,
    };
    await prisma.superAdminProfile.upsert({
      where: {
        organizationId_saCode: { organizationId: orgId, saCode: str(sa["Admin ID"]) },
      },
      create: { organizationId: orgId, saCode: str(sa["Admin ID"]), ...data },
      update: data,
    });
    bump("superAdmins");
  }

  // 3. Applications + Environments
  for (const a of parseApplications(wb)) {
    const departmentId = deptIdByName.get(a.department);
    if (!departmentId) {
      skip("Applications", 0, `Unknown department: ${a.department}`);
      continue;
    }
    const app = await prisma.application.upsert({
      where: {
        organizationId_name_departmentId: {
          organizationId: orgId,
          name: a.application,
          departmentId,
        },
      },
      create: {
        organizationId: orgId,
        name: a.application,
        departmentId,
        productOwner: a.applicationOwner || "Unknown",
        techLead: a.techLead || "Unknown",
      },
      update: {
        productOwner: a.applicationOwner || "Unknown",
        techLead: a.techLead || "Unknown",
      },
    });
    appIdByKey.set(`${a.department}::${a.application}`, app.id);
    appIdByName.set(a.application, app.id);
    bump("applications");

    for (const e of a.environments) {
      const env = await prisma.environment.upsert({
        where: { applicationId_name: { applicationId: app.id, name: e.env } },
        create: {
          applicationId: app.id,
          name: e.env,
          type: e.env,
          owner: e.envOwner || "",
          status: "Active",
        },
        update: { owner: e.envOwner || "", type: e.env },
      });
      envIdByAppEnv.set(`${app.id}::${e.env}`, env.id);
      bump("environments");
    }
  }

  // 4. Releases (Release.owner no longer exists — releaseOwnerId relation only)
  const releases = parseSheetWithId(
    wb,
    "Releases",
    ["Release ID", "Release Name", "Department"],
    "Release ID",
    /^REL-\d+$/,
    10
  );
  for (const r of releases) {
    const departmentId = deptIdByName.get(str(r["Department"]));
    if (!departmentId) {
      skip("Releases", 0, `Department not found: ${r["Department"]}`);
      continue;
    }
    const ownerUserId = str(r["Release Owner ID"]);
    const ownerDbId = ownerUserId ? userDbIdByUserId.get(ownerUserId) : undefined;
    const ownerName = userNameByUserId.get(ownerUserId) ?? ownerUserId ?? "Unknown";
    const releaseCode = str(r["Release ID"]);

    const data = {
      name: str(r["Release Name"]),
      status: str(r["Status"]),
      releaseDate: excelDate(r["End Date"]) ?? excelDate(r["Prod Release Date"]) ?? new Date(),
      endDate: excelDate(r["End Date"]),
      priority: str(r["Priority"]),
      impact: str(r["Impact"]),
      departmentId,
      notes: str(r["Notes"]) || null,
      releaseSize: str(r["Release Size"]) || null,
      cabDate: excelDate(r["CAB Date"]),
      startDate: excelDate(r["Start Date"]),
      testEnvRequired: str(r["Test Env Required"]) || null,
      uatEnvRequired: str(r["UAT Env Required"]) || null,
      conflictFlag: isConflictFlag(r["Conflict Flag"]),
      readinessPercent: percentFromDecimal(r["Readiness %"]),
      blockers: str(r["Blockers"]) || null,
      vendorMaintenance: str(r["Vendor Maintenance"]) || null,
      changeFreeze: str(r["Change Freeze"]) || null,
      regulatory: str(r["Regulatory"]) || null,
      approvalStatus: str(r["Approval Status"]) || null,
      rollbackPlan: str(r["Rollback Plan"]) || null,
      goLiveChecklistPercent: percentFromDecimal(r["Go-Live Checklist %"]),
      deploymentWindow: str(r["Deployment Window"]) || null,
      releaseOwnerId: ownerDbId,
    };
    const release = await prisma.release.upsert({
      where: { organizationId_releaseCode: { organizationId: orgId, releaseCode } },
      create: { organizationId: orgId, releaseCode, ...data },
      update: data,
    });
    releaseIdByCode.set(releaseCode, release.id);
    releaseOwnerNameByCode.set(releaseCode, ownerName);
    bump("releases");

    const appId = lookupAppId(str(r["Application"]), str(r["Department"]), "Releases", 0);
    if (appId) {
      await prisma.releaseApplication.upsert({
        where: { releaseId_applicationId: { releaseId: release.id, applicationId: appId } },
        create: { releaseId: release.id, applicationId: appId },
        update: {},
      });
    }

    for (const sid of splitIds(r["Stakeholder IDs"])) {
      const suDbId = userDbIdByUserId.get(sid);
      if (!suDbId) continue;
      await prisma.releaseStakeholder.upsert({
        where: { releaseId_userId: { releaseId: release.id, userId: suDbId } },
        create: { releaseId: release.id, userId: suDbId },
        update: {},
      });
    }
  }

  // 4b. Release risk metrics (wide table on the Risk Factors sheet)
  const riskFactorRows = sheetRows(wb, "Risk Factors");
  const METRIC_CONTEXT_COLUMNS = new Set(["Release ID", "Release Name", "Prod Date", "Days Out"]);
  const metricsHeaderIdx = findHeaderRowContains(riskFactorRows, "Release ID", 120);
  const metricHeaders = (riskFactorRows[metricsHeaderIdx] ?? []).map((h) => str(h));
  const metricRows = rowsToObjects(riskFactorRows, metricsHeaderIdx).filter((r) =>
    /^REL-\d+$/.test(str(r["Release ID"]))
  );
  let releaseRiskMetricCount = 0;
  for (const row of metricRows) {
    const releaseCode = str(row["Release ID"]);
    const releaseId = releaseIdByCode.get(releaseCode);
    if (!releaseId) {
      skip("Risk Factors", 0, `Release not found for metrics row: ${releaseCode}`);
      continue;
    }
    await prisma.releaseRiskMetric.deleteMany({ where: { releaseId } });
    for (const header of metricHeaders) {
      if (!header || header.startsWith("Unnamed") || METRIC_CONTEXT_COLUMNS.has(header)) continue;
      const val = row[header];
      if (val == null || str(val) === "") continue;
      await prisma.releaseRiskMetric.create({
        data: { releaseId, metricName: header, metricValue: storeAsString(val) },
      });
      releaseRiskMetricCount++;
    }
  }
  counts.releaseRiskMetrics = releaseRiskMetricCount;

  // 5. Env bookings (no bookingCode in new schema — wipe org's rows, then create)
  await prisma.envBooking.deleteMany({ where: { organizationId: orgId } });
  const bookings = parseSheetWithId(
    wb,
    "Env booking",
    ["Booking ID", "Release ID", "Application"],
    "Booking ID",
    /^ENV-\d+$/,
    10
  );
  for (const b of bookings) {
    const applicationId = lookupAppId(str(b["Application"]), str(b["Department"]), "Env booking", 0);
    if (!applicationId) continue;
    const releaseId = releaseIdByCode.get(str(b["Release ID"]));
    const bookedByName = releaseId
      ? (releaseOwnerNameByCode.get(str(b["Release ID"])) ?? "Unknown")
      : "Unknown";

    const legDates = [
      excelDate(b["Test Start"]),
      excelDate(b["Test End"]),
      excelDate(b["UAT Start"]),
      excelDate(b["UAT End"]),
      excelDate(b["Pre-Prod Start"]),
      excelDate(b["Pre-Prod End"]),
    ].filter(Boolean) as Date[];
    const prodDate = excelDate(b["Prod Release Date"]) ?? new Date();
    const fromDate = legDates.length ? new Date(Math.min(...legDates.map((d) => d.getTime()))) : prodDate;
    const toDate = legDates.length ? new Date(Math.max(...legDates.map((d) => d.getTime()))) : prodDate;

    await prisma.envBooking.create({
      data: {
        organizationId: orgId,
        applicationId,
        bookedBy: bookedByName,
        team: str(b["Department"]) || "Unknown",
        departmentName: str(b["Department"]) || null,
        fromDate,
        toDate,
        releaseId,
        releaseSize: str(b["Release Size"]) || null,
        prodReleaseDate: excelDate(b["Prod Release Date"]),
        cabDate: excelDate(b["CAB Date"]),
        testEnvCode: str(b["Test Env"]) || null,
        testStart: excelDate(b["Test Start"]),
        testEnd: excelDate(b["Test End"]),
        testDays: parseIntOrZero(b["Test Days"]),
        uatEnvCode: str(b["UAT Env"]) || null,
        uatStart: excelDate(b["UAT Start"]),
        uatEnd: excelDate(b["UAT End"]),
        uatDays: parseIntOrZero(b["UAT Days"]),
        preProdEnvCode: str(b["Pre-Prod Env"]) || null,
        preProdStart: excelDate(b["Pre-Prod Start"]),
        preProdEnd: excelDate(b["Pre-Prod End"]),
        preProdDays: parseIntOrZero(b["Pre-Prod Days"]),
        conflictFlag: isConflictFlag(b["Conflict Flag"]),
        purpose: str(b["Notes"]) || null,
      },
    });
    bump("envBookings");
  }

  // 6. Risks
  const risks = parseSheetWithId(wb, "Risk", ["Risk ID", "Release ID"], "Risk ID", /^RSK-\d+$/, 10);
  for (const r of risks) {
    const releaseId = releaseIdByCode.get(str(r["Release ID"]));
    if (!releaseId) {
      skip("Risk", 0, `Release not found: ${r["Release ID"]}`);
      continue;
    }
    const riskCode = str(r["Risk ID"]);
    await prisma.risk.upsert({
      where: { organizationId_riskCode: { organizationId: orgId, riskCode } },
      create: {
        organizationId: orgId,
        riskCode,
        releaseId,
        category: str(r["Risk Category"]),
        description: str(r["Risk Description"]),
        likelihood: parseIntOrZero(r["Likelihood"]),
        impact: parseIntOrZero(r["Impact"]),
        riskScore: parseIntOrZero(r["Risk Score"]),
        affectedArea: str(r["Affected Area"]) || null,
        mitigationStrategy: str(r["Mitigation Strategy"]) || null,
        riskOwnerId: userDbIdByUserId.get(str(r["Risk Owner ID"])) ?? null,
        status: str(r["Status"]),
        notes: str(r["Notes"]) || null,
      },
      update: {
        releaseId,
        category: str(r["Risk Category"]),
        description: str(r["Risk Description"]),
        likelihood: parseIntOrZero(r["Likelihood"]),
        impact: parseIntOrZero(r["Impact"]),
        riskScore: parseIntOrZero(r["Risk Score"]),
        status: str(r["Status"]),
      },
    });
    bump("risks");
  }

  // 7. Drifts
  const drifts = parseSheetWithId(wb, "Drift", ["Drift ID", "Release ID"], "Drift ID", /^DFT-\d+$/, 10);
  for (const d of drifts) {
    const releaseId = releaseIdByCode.get(str(d["Release ID"]));
    const applicationId = lookupAppId(str(d["Application"]), str(d["Department"]), "Drift", 0);
    if (!releaseId || !applicationId) continue;
    const driftCode = str(d["Drift ID"]);
    await prisma.drift.upsert({
      where: { organizationId_driftCode: { organizationId: orgId, driftCode } },
      create: {
        organizationId: orgId,
        driftCode,
        releaseId,
        applicationId,
        environmentName: str(d["Environment"]),
        driftType: str(d["Drift Type"]),
        driftCategory: str(d["Drift Category"]) || null,
        detectedDate: excelDate(d["Detected Date"])!,
        severity: str(d["Severity"]),
        description: str(d["Description"]),
        impactOnRelease: str(d["Impact on Release"]) || null,
        remediationAction: str(d["Remediation Action"]) || null,
        status: str(d["Status"]),
        etaToFix: excelDate(d["ETA to Fix"]),
      },
      update: { releaseId, applicationId, status: str(d["Status"]) },
    });
    bump("drifts");
  }

  // 8. Approvals
  const approvals = parseSheetWithId(
    wb,
    "Approvals",
    ["Approval ID", "Release ID"],
    "Approval ID",
    /^APR-\d+$/,
    8
  );
  for (const a of approvals) {
    const releaseId = releaseIdByCode.get(str(a["Release ID"]));
    const approverId = userDbIdByUserId.get(str(a["Approver ID"]));
    if (!releaseId || !approverId) {
      skip("Approvals", 0, `Missing release or approver for ${a["Approval ID"]}`);
      continue;
    }
    const approvalCode = str(a["Approval ID"]);
    await prisma.approval.upsert({
      where: { organizationId_approvalCode: { organizationId: orgId, approvalCode } },
      create: {
        organizationId: orgId,
        approvalCode,
        releaseId,
        approvalType: str(a["Approval Type"]),
        approverId,
        submittedDate: excelDate(a["Submitted Date"])!,
        decisionDate: excelDate(a["Decision Date"]),
        decision: str(a["Decision"]) || "Pending",
        comments: str(a["Comments"]) || null,
        cabMeetingId: str(a["CAB Meeting ID"]) || null,
      },
      update: {
        releaseId,
        decision: str(a["Decision"]) || "Pending",
        decisionDate: excelDate(a["Decision Date"]),
      },
    });
    bump("approvals");
  }

  // 9. Calendar events
  await prisma.calendarEvent.deleteMany({ where: { organizationId: orgId } });
  const calRows = sheetRows(wb, "Calendar");
  const calHeaderIdx = findHeaderRow(calRows, ["Date", "Event Type"], 20);
  const calData = rowsToObjects(calRows, calHeaderIdx).filter((r) => isRealDate(r["Date"]));
  for (const c of calData) {
    const releaseId = str(c["Release ID"]) ? releaseIdByCode.get(str(c["Release ID"])) : undefined;
    await prisma.calendarEvent.create({
      data: {
        organizationId: orgId,
        date: excelDate(c["Date"])!,
        eventType: str(c["Event Type"]),
        releaseId,
        title: str(c["Release Name"]) || str(c["Event Type"]),
        departmentName: str(c["Department"]) || null,
        sizeImpact: str(c["Size/Impact"]) || null,
        notes: str(c["Notes"]) || null,
      },
    });
    bump("calendarEvents");
  }

  // 10. Release dependencies (natural key is now the release pair)
  const deps = parseSheetWithId(wb, "Dependencies", ["Dep ID", "Release ID"], "Dep ID", /^DEP-\d+$/, 8);
  for (const d of deps) {
    const releaseId = releaseIdByCode.get(str(d["Release ID"]));
    const dependsOnReleaseId = releaseIdByCode.get(str(d["Depends On Release"]));
    if (!releaseId || !dependsOnReleaseId) {
      skip("Dependencies", 0, `Missing release for ${d["Dep ID"]}`);
      continue;
    }
    await prisma.releaseDependency.upsert({
      where: {
        releaseId_dependsOnReleaseId: { releaseId, dependsOnReleaseId },
      },
      create: {
        releaseId,
        dependsOnReleaseId,
        dependencyType: str(d["Dependency Type"]) || null,
        status: str(d["Status"]) || null,
        impactIfBlocked: str(d["Impact if Blocked"]) || null,
        notes: str(d["Notes"]) || null,
      },
      update: { status: str(d["Status"]) || null },
    });
    bump("releaseDependencies");
  }

  // 11. Leave records
  const leaves = parseSheetWithId(wb, "Leave Calendar", ["Leave ID", "User ID"], "Leave ID", /^LV-\d+$/, 8);
  for (const l of leaves) {
    const userId = userDbIdByUserId.get(str(l["User ID"]));
    if (!userId) {
      skip("Leave Calendar", 0, `User not found: ${l["User ID"]}`);
      continue;
    }
    const leaveCode = str(l["Leave ID"]);
    const leave = await prisma.leaveRecord.upsert({
      where: { organizationId_leaveCode: { organizationId: orgId, leaveCode } },
      create: {
        organizationId: orgId,
        leaveCode,
        userId,
        leaveStart: excelDate(l["Leave Start"])!,
        leaveEnd: excelDate(l["Leave End"])!,
        leaveType: str(l["Leave Type"]),
        days: parseIntOrZero(l["Days"]),
        riskImpact: str(l["Risk Impact"]) || null,
        riskScore: parseIntOrZero(l["Risk Score"]),
      },
      update: {
        leaveStart: excelDate(l["Leave Start"])!,
        leaveEnd: excelDate(l["Leave End"])!,
        leaveType: str(l["Leave Type"]),
        days: parseIntOrZero(l["Days"]),
      },
    });
    bump("leaveRecords");
    for (const relCode of splitIds(l["Affected Release"])) {
      const releaseId = releaseIdByCode.get(relCode);
      if (!releaseId) continue;
      await prisma.leaveRecordRelease.upsert({
        where: { leaveRecordId_releaseId: { leaveRecordId: leave.id, releaseId } },
        create: { leaveRecordId: leave.id, releaseId },
        update: {},
      });
    }
  }

  // 12. Environment versions
  const versions = parseSheetWithId(
    wb,
    "Versions",
    ["App ID", "Application", "Environment"],
    "App ID",
    /^APP-\d+$/,
    5
  );
  for (const v of versions) {
    const applicationId = lookupAppId(str(v["Application"]), undefined, "Versions", 0);
    if (!applicationId) continue;
    const envName = str(v["Environment"]);
    const environmentId = envIdByAppEnv.get(`${applicationId}::${envName}`);
    if (!environmentId) {
      skip("Versions", 0, `Environment not found: ${v["Application"]} / ${envName}`);
      continue;
    }
    const data = {
      version: str(v["Version"]),
      updatedBy: str(v["Deployed By"]) || null,
      buildNumber: str(v["Build Number"]) || null,
      deployDate: excelDate(v["Deploy Date"]),
      status: str(v["Status"]) || null,
      notes: str(v["Notes"]) || null,
    };
    await prisma.environmentVersion.upsert({
      where: { applicationId_environmentId: { applicationId, environmentId } },
      create: { applicationId, environmentId, ...data },
      update: data,
    });
    bump("environmentVersions");
  }

  // 13. System integrations — "CORE SYSTEMS HUB" sub-table on the System
  // Mapping sheet only (that sheet also holds a department matrix, integration
  // flow list, and shared-environment tables below it that must NOT be parsed
  // as hub rows — stop at the first blank row after the header, don't skip past it).
  await prisma.systemIntegration.deleteMany({ where: { organizationId: orgId } });
  const mapRows = sheetRows(wb, "System Mapping");
  const hubHeaderIdx = findHeaderRowContains(mapRows, "System", 20);
  const hubHeaders = (mapRows[hubHeaderIdx] ?? []).map((h) => str(h));
  const hubData: Row[] = [];
  for (let i = hubHeaderIdx + 1; i < mapRows.length; i++) {
    const raw = mapRows[i] ?? [];
    if (raw.every((c) => c == null || str(c) === "")) break;
    const obj: Row = {};
    hubHeaders.forEach((h, idx) => {
      if (h) obj[h] = raw[idx] ?? null;
    });
    hubData.push(obj);
  }
  for (const row of hubData) {
    const system = str(row["System"]);
    if (!system) continue;
    const integratesWith = str(row["Integrates With"] || row["Integrates With Systems"]);
    if (!integratesWith) continue;
    const applicationId = lookupAppId(system, str(row["Department"]), "System Mapping", 0);
    if (!applicationId) continue;
    await prisma.systemIntegration.create({
      data: {
        organizationId: orgId,
        sourceAppId: applicationId,
        departmentName: str(row["Department"]) || null,
        systemType: str(row["System Type"] || row["Type"]) || null,
        integratesWith,
        dataFlow: str(row["Data Flow"] || row["Flow Direction"]) || null,
        keyDataExchanged: str(row["Key Data Exchanged"] || row["Data Exchanged"]) || null,
      },
    });
    bump("systemIntegrations");
  }

  // 14. Monitoring alerts
  const alerts = parseSheetWithId(wb, "Monitoring Alerts", ["Alert ID", "Application"], "Alert ID", /^ALT-\d+$/);
  for (const a of alerts) {
    const applicationId = lookupAppId(str(a["Application"]), str(a["Department"]), "Monitoring Alerts", 0);
    if (!applicationId) continue;
    const alertCode = str(a["Alert ID"]);
    await prisma.monitoringAlert.upsert({
      where: { organizationId_alertCode: { organizationId: orgId, alertCode } },
      create: {
        organizationId: orgId,
        alertCode,
        timestamp: excelDate(a["Timestamp"] || a["Date/Time"])!,
        applicationId,
        departmentName: str(a["Department"]) || null,
        alertType: str(a["Alert Type"]),
        severity: str(a["Severity"]),
        metric: str(a["Metric"]),
        threshold: storeAsString(a["Threshold"]),
        currentValue: storeAsString(a["Current Value"]),
        status: str(a["Status"]),
        assignedTo: str(a["Assigned To"]) || null,
        environmentName: str(a["Environment"]) || null,
      },
      update: { status: str(a["Status"]), currentValue: storeAsString(a["Current Value"]) },
    });
    bump("monitoringAlerts");
  }

  // 15. Incidents
  const incidents = parseSheetWithId(wb, "Incidents", ["Incident ID", "Application"], "Incident ID", /^INC-\d+$/);
  for (const inc of incidents) {
    const applicationId = lookupAppId(str(inc["Application"]), str(inc["Department"]), "Incidents", 0);
    if (!applicationId) continue;
    const relatedReleaseId = str(inc["Related Release"])
      ? releaseIdByCode.get(str(inc["Related Release"]))
      : undefined;
    const incidentCode = str(inc["Incident ID"]);
    await prisma.incident.upsert({
      where: { organizationId_incidentCode: { organizationId: orgId, incidentCode } },
      create: {
        organizationId: orgId,
        incidentCode,
        timestamp: excelDate(inc["Timestamp"] || inc["Date/Time"])!,
        applicationId,
        departmentName: str(inc["Department"]) || null,
        severity: str(inc["Severity"]),
        title: str(inc["Title"]),
        status: str(inc["Status"]),
        impact: str(inc["Impact"]) || null,
        assignedTo: str(inc["Assigned To"]) || null,
        relatedReleaseId,
        environmentName: str(inc["Environment"]) || null,
      },
      update: { status: str(inc["Status"]), title: str(inc["Title"]) },
    });
    bump("incidents");
  }

  // 16. Planned maintenance
  const maintenance = parseSheetWithId(wb, "Planned Maintenance", ["Maintenance ID"], "Maintenance ID", /^MNT-\d+$/);
  for (const m of maintenance) {
    const maintenanceCode = str(m["Maintenance ID"]);
    await prisma.plannedMaintenance.upsert({
      where: {
        organizationId_maintenanceCode: { organizationId: orgId, maintenanceCode },
      },
      create: {
        organizationId: orgId,
        maintenanceCode,
        scheduledDate: excelDate(m["Scheduled Date"])!,
        startTime: excelTimeToHHMM(m["Start Time"]),
        endTime: excelTimeToHHMM(m["End Time"]),
        maintenanceType: str(m["Maintenance Type"] || m["Type"]),
        applications: str(m["Applications"] || m["Application(s)"]),
        environments: str(m["Environments"] || m["Environment(s)"]),
        departmentName: str(m["Department"]) || null,
        impact: str(m["Impact"]) || null,
        requestor: str(m["Requestor"]) || null,
        approvalStatus: str(m["Approval Status"]) || null,
        notes: str(m["Notes"]) || null,
      },
      update: {
        scheduledDate: excelDate(m["Scheduled Date"])!,
        approvalStatus: str(m["Approval Status"]) || null,
      },
    });
    bump("plannedMaintenance");
  }

  // 17. Application status checks + patch Environment.status
  const statusRows = sheetRows(wb, "Application Status");
  const statusHeaderIdx = findHeaderRow(statusRows, ["Application", "Environment", "Status"], 5);
  const statusData = rowsToObjects(statusRows, statusHeaderIdx).filter((r) =>
    VALID_ENVS.has(str(r["Environment"]))
  );
  for (const s of statusData) {
    const applicationId = lookupAppId(str(s["Application"]), str(s["Department"]), "Application Status", 0);
    if (!applicationId) continue;
    const envName = str(s["Environment"]);
    const data = {
      status: str(s["Status"]),
      lastCheck: excelDate(s["Last Check"] || s["Last Checked"])!,
      uptimePercent: parseFloatOrNull(s["Uptime %"] || s["Uptime"]),
      notes: str(s["Notes"]) || null,
    };
    await prisma.applicationStatusCheck.upsert({
      where: {
        applicationId_environmentName: { applicationId, environmentName: envName },
      },
      create: { organizationId: orgId, applicationId, environmentName: envName, ...data },
      update: data,
    });
    bump("applicationStatusChecks");

    const environmentId = envIdByAppEnv.get(`${applicationId}::${envName}`);
    if (environmentId) {
      await prisma.environment.update({
        where: { id: environmentId },
        data: { status: str(s["Status"]) },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Checks
// ─────────────────────────────────────────────────────────────────────

async function runIntegrityChecks() {
  const failures: string[] = [];

  const releasesWithoutApp = await prisma.release.count({
    where: { applications: { none: {} } },
  });
  if (releasesWithoutApp > 0) failures.push(`${releasesWithoutApp} Release(s) with no ReleaseApplication`);

  const checks: { label: string; sql: string }[] = [
    {
      label: "EnvBooking",
      sql: `SELECT COUNT(*)::int AS c FROM "EnvBooking" b LEFT JOIN "Release" r ON b."releaseId" = r.id WHERE b."releaseId" IS NOT NULL AND r.id IS NULL`,
    },
    {
      label: "Risk",
      sql: `SELECT COUNT(*)::int AS c FROM "Risk" t LEFT JOIN "Release" r ON t."releaseId" = r.id WHERE r.id IS NULL`,
    },
    {
      label: "Drift",
      sql: `SELECT COUNT(*)::int AS c FROM "Drift" t LEFT JOIN "Release" r ON t."releaseId" = r.id WHERE r.id IS NULL`,
    },
    {
      label: "Approval",
      sql: `SELECT COUNT(*)::int AS c FROM "Approval" t LEFT JOIN "Release" r ON t."releaseId" = r.id WHERE r.id IS NULL`,
    },
    {
      label: "ReleaseDependency",
      sql: `SELECT COUNT(*)::int AS c FROM "ReleaseDependency" d LEFT JOIN "Release" r1 ON d."releaseId" = r1.id LEFT JOIN "Release" r2 ON d."dependsOnReleaseId" = r2.id WHERE r1.id IS NULL OR r2.id IS NULL`,
    },
    {
      label: "MonitoringAlert",
      sql: `SELECT COUNT(*)::int AS c FROM "MonitoringAlert" t LEFT JOIN "Application" a ON t."applicationId" = a.id WHERE a.id IS NULL`,
    },
    {
      label: "Incident",
      sql: `SELECT COUNT(*)::int AS c FROM "Incident" t LEFT JOIN "Application" a ON t."applicationId" = a.id WHERE a.id IS NULL`,
    },
  ];

  for (const { label, sql } of checks) {
    const result = await prisma.$queryRawUnsafe<{ c: number }[]>(sql);
    const n = result[0]?.c ?? 0;
    if (n > 0) failures.push(`${n} ${label} row(s) with broken FK`);
  }

  if (failures.length > 0) {
    throw new Error(`Integrity check failed:\n- ${failures.join("\n- ")}`);
  }
}

async function runAcceptanceChecks(sentinelOrgId: string, demoOrgId: string) {
  const failures: string[] = [];

  // Every org-scoped row seeded from the workbook belongs to the demo org.
  const strayReleases = await prisma.release.count({
    where: { organizationId: { not: demoOrgId } },
  });
  if (strayReleases > 0) failures.push(`${strayReleases} Release(s) outside the demo org`);

  const superAdminCount = await prisma.superAdminProfile.count({
    where: { organizationId: demoOrgId },
  });
  if (superAdminCount !== 12) failures.push(`SuperAdminProfile: expected 12, got ${superAdminCount}`);

  const sentinelFactors = await prisma.riskFactorDefinition.count({
    where: { organizationId: sentinelOrgId, isSystemDefault: true },
  });
  if (sentinelFactors !== 44) {
    failures.push(`Sentinel RiskFactorDefinition: expected 44, got ${sentinelFactors}`);
  }

  // Clone landed in the demo org and is idempotent (verified by caller re-run).
  const demoFactors = await prisma.riskFactorDefinition.count({
    where: { organizationId: demoOrgId },
  });
  if (demoFactors !== sentinelFactors) {
    failures.push(`Demo org risk factors: expected ${sentinelFactors} cloned, got ${demoFactors}`);
  }

  const rmWithoutRegion = await prisma.user.count({
    where: { organizationId: demoOrgId, role: "Release Manager", region: null },
  });
  if (rmWithoutRegion > 0) {
    failures.push(`${rmWithoutRegion} Release Manager User(s) missing region after enrichment`);
  }

  if (failures.length > 0) {
    throw new Error(`Acceptance check failed:\n- ${failures.join("\n- ")}`);
  }
}

function printSummary() {
  console.log("\n── Seed summary ──");
  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = counts[key] ?? 0;
    const ok = actual === expected ? "✓" : "✗";
    console.log(`${ok} ${key}: ${actual} / expected ${expected}`);
  }
  const templateKeys = Object.keys(counts).filter((k) => k.startsWith("tpl:"));
  if (templateKeys.length) {
    console.log("\n── System default templates (sentinel org) ──");
    for (const k of templateKeys) console.log(`  ${k.slice(4)}: ${counts[k]}`);
  }
  if (skipped.length > 0) {
    console.log(`\nSkipped rows: ${skipped.length}`);
    for (const s of skipped.slice(0, 20)) {
      console.log(`  - ${s.sheet} #${s.row}: ${s.reason}`);
    }
    if (skipped.length > 20) console.log(`  ... and ${skipped.length - 20} more`);
  }
}

async function main() {
  const wb = loadWorkbook();

  // 1. Sentinel global org
  const sentinelOrg = await prisma.organization.upsert({
    where: { slug: SENTINEL_ORG_SLUG },
    create: { name: "Sentinel System Global", slug: SENTINEL_ORG_SLUG, isSystemGlobal: true },
    update: { isSystemGlobal: true },
  });
  console.log(`Sentinel org: ${sentinelOrg.id}`);

  // 2. System default templates under the sentinel org
  await seedSystemDefaults(wb, sentinelOrg.id);

  // 3. Demo org
  const demoOrg = await prisma.organization.upsert({
    where: { slug: DEMO_ORG.slug },
    create: { name: DEMO_ORG.name, slug: DEMO_ORG.slug },
    update: { name: DEMO_ORG.name },
  });
  console.log(`Demo org: ${demoOrg.id}`);

  // 4. Workbook data under the demo org
  await seedDemoOrgData(wb, demoOrg.id);

  // 5. Clone system defaults into the demo org via the onboarding function
  //    (run twice on purpose — proves idempotency on every seed run).
  const first = await cloneSystemDefaultsToOrg(demoOrg.id);
  const second = await cloneSystemDefaultsToOrg(demoOrg.id);
  const clonedTotal = first.reduce((n, r) => n + r.cloned, 0);
  const dupCreated = second.reduce((n, r) => n + r.cloned, 0);
  console.log(`cloneSystemDefaultsToOrg: first run cloned ${clonedTotal}, second run cloned ${dupCreated}`);
  if (dupCreated > 0) {
    throw new Error(`cloneSystemDefaultsToOrg is not idempotent: second run created ${dupCreated} rows`);
  }

  await runIntegrityChecks();
  await runAcceptanceChecks(sentinelOrg.id, demoOrg.id);
  printSummary();

  const mismatches = Object.entries(EXPECTED_COUNTS).filter(([k, exp]) => {
    const actual = counts[k] ?? 0;
    if (k === "riskFactorDefinitions") return false; // now seeded as templates (tpl:riskFactors)
    if (k === "systemIntegrations") return actual < 4 || actual > 8;
    return actual !== exp;
  });
  if (mismatches.length > 0) {
    throw new Error(
      `Count mismatch:\n${mismatches.map(([k, exp]) => `  ${k}: got ${counts[k] ?? 0}, expected ${exp}`).join("\n")}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
