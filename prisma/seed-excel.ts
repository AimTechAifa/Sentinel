import { PrismaClient } from "@prisma/client";
import * as xlsx from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

function parseExcelDate(excelDate: number | string | null | undefined): Date | null {
  if (!excelDate) return null;
  if (typeof excelDate === "number") {
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  }
  if (typeof excelDate === "string") {
    const d = new Date(excelDate);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function parseScore(val: any): number {
  if (!val) return 1;
  const s = String(val).toLowerCase();
  if (s.includes("high")) return 3;
  if (s.includes("medium")) return 2;
  if (s.includes("low")) return 1;
  const num = parseInt(s);
  return isNaN(num) ? 1 : num;
}

async function main() {
  console.log("Loading Excel file...");
  const filePath = path.join(__dirname, "ReleaseDesk_SampleData (1).xlsx");
  const wb = xlsx.readFile(filePath);

  const getSheetData = (sheetName: string, range: number = 0) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) { console.log(`WARNING: Sheet "${sheetName}" not found!`); return []; }
    return xlsx.utils.sheet_to_json<any>(ws, { range });
  };

  const releasesData = getSheetData("Releases", 0);
  const depsData = getSheetData("Dependencies", 2);
  const bookingsData = getSheetData("Env booking", 0);
  const risksData = getSheetData("Risk", 3);
  const driftsData = getSheetData("Drift", 3);
  const approvalsData = getSheetData("Approvals", 2);
  const leavesData = getSheetData("Leave Calendar", 0);
  const versionsData = getSheetData("Versions", 0);
  const calendarData = getSheetData("Calendar", 10);

  console.log(`Loaded: ${releasesData.length} releases, ${risksData.length} risks, ${driftsData.length} drifts, ${bookingsData.length} bookings, ${approvalsData.length} approvals, ${leavesData.length} leaves, ${calendarData.length} calendar events`);

  console.log("Upserting base data...");

  const usersMap = new Map<string, string>();
  const deptMap = new Map<string, string>();
  const appMap = new Map<string, string>();
  const envMap = new Map<string, string>();

  for (const row of leavesData) {
    if (!row["User ID"] || !row["Department"]) continue;
    const deptName = row["Department"];
    if (!deptMap.has(deptName)) {
      const d = await prisma.department.upsert({
        where: { name: deptName },
        update: {},
        create: { name: deptName, head: "TBD" },
      });
      deptMap.set(deptName, d.id);
    }
    const userId = row["User ID"];
    if (!usersMap.has(userId)) {
      const u = await prisma.user.upsert({
        where: { userId },
        update: {
          name: row["User Name"] || userId,
          role: row["Role"] || "Employee",
          department: deptName,
        },
        create: {
          userId,
          name: row["User Name"] || userId,
          email: `${userId.toLowerCase()}@company.com`,
          role: row["Role"] || "Employee",
          department: deptName,
          status: "Active",
          accessLevel: "User",
        },
      });
      usersMap.set(userId, u.id);
    }
  }

  for (const row of versionsData) {
    const deptName = row["Department"];
    if (deptName && !deptMap.has(deptName)) {
      const d = await prisma.department.upsert({
        where: { name: deptName },
        update: {},
        create: { name: deptName, head: "TBD" },
      });
      deptMap.set(deptName, d.id);
    }
    const appName = row["Application"];
    if (appName && !appMap.has(appName)) {
      const a = await prisma.application.upsert({
        where: { name_departmentId: { name: appName, departmentId: deptMap.get(deptName)! } },
        update: { departmentId: deptMap.get(deptName)! },
        create: { 
          name: appName, 
          departmentId: deptMap.get(deptName)!,
          type: "TBD",
          productOwner: "TBD",
          techLead: "TBD",
          support: "TBD",
          criticality: "Medium"
        },
      });
      appMap.set(appName, a.id);
    }
    const envName = row["Environment"];
    if (envName && !envMap.has(envName)) {
      const appId = appMap.get(appName);
      if (appId) {
        const e = await prisma.environment.upsert({
          where: { applicationId_name: { applicationId: appId, name: envName } },
          update: {},
          create: { 
            applicationId: appId,
            name: envName, 
            type: envName.toLowerCase().includes("prod") ? "Production" : "Non-Production",
            owner: "TBD",
            status: "Active"
          },
        });
        envMap.set(envName, e.id);
      }
    }
  }

  console.log("Upserting environment versions...");
  for (const row of versionsData) {
    if (!row["Application"] || !row["Environment"]) continue;
    const appId = appMap.get(row["Application"]);
    const envId = envMap.get(row["Environment"]);
    if (!appId || !envId) continue;
    let uId: string | null = null;
    if (row["Deployed By"]) {
        const u = await prisma.user.findFirst({ where: { name: row["Deployed By"] } });
        uId = u?.id || null;
    }
    await prisma.environmentVersion.upsert({
      where: {
        applicationId_environmentId: { applicationId: appId, environmentId: envId }
      },
      update: {
        version: row["Version"] || "Unknown",
        buildNumber: row["Build Number"],
        deployDate: parseExcelDate(row["Deploy Date"]),
        updatedBy: uId,
        status: row["Status"] || "Active",
        notes: row["Notes"],
      },
      create: {
        applicationId: appId,
        environmentId: envId,
        version: row["Version"] || "Unknown",
        buildNumber: row["Build Number"],
        deployDate: parseExcelDate(row["Deploy Date"]),
        updatedBy: uId,
        status: row["Status"] || "Active",
        notes: row["Notes"],
      },
    });
  }

  console.log("Upserting releases...");
  const releaseMap = new Map<string, string>();
  for (const row of releasesData) {
    const code = row["Release ID"];
    if (!code) continue;
    const deptName = row["Department"];
    if (deptName && !deptMap.has(deptName)) {
      const d = await prisma.department.upsert({ where: { name: deptName }, update: {}, create: { name: deptName, head: "TBD" } });
      deptMap.set(deptName, d.id);
    }
    
    const rmName = row["Release Owner ID"];
    let releaseOwnerId: string | null = null;
    if (rmName) {
      const rm = await prisma.user.findFirst({ where: { userId: rmName } });
      if (rm) {
        releaseOwnerId = rm.id;
      }
    }

    const r = await prisma.release.upsert({
      where: { releaseCode: code },
      update: {
        name: row["Release Name"] || code,
        status: row["Status"] || "Draft",
        releaseDate: parseExcelDate(row["End Date"]) || new Date(),
        priority: row["Priority"] || "Medium",
        owner: row["Release Owner ID"] || "TBD",
        releaseOwnerId,
        impact: row["Impact"] || "Medium",
        conflictFlag: row["Conflict Flag"] === "Yes" || row["Conflict Flag"] === "⚠️ CONFLICT",
        departmentId: deptMap.get(deptName)!,
        releaseSize: row["Release Size"],
        readinessPercent: row["Readiness %"] ? parseFloat(row["Readiness %"].toString()) : 0,
        approvalStatus: row["Approval Status"] === "CAB Approved" || row["Approval Status"] === "Approved" ? "Approved" : "Pending",
      },
      create: {
        releaseCode: code,
        name: row["Release Name"] || code,
        status: row["Status"] || "Draft",
        releaseDate: parseExcelDate(row["End Date"]) || new Date(),
        priority: row["Priority"] || "Medium",
        owner: row["Release Owner ID"] || "TBD",
        releaseOwnerId,
        impact: row["Impact"] || "Medium",
        conflictFlag: row["Conflict Flag"] === "Yes" || row["Conflict Flag"] === "⚠️ CONFLICT",
        departmentId: deptMap.get(deptName)!,
        releaseSize: row["Release Size"],
        readinessPercent: row["Readiness %"] ? parseFloat(row["Readiness %"].toString()) : 0,
        approvalStatus: row["Approval Status"] === "CAB Approved" || row["Approval Status"] === "Approved" ? "Approved" : "Pending",
      },
    });
    releaseMap.set(code, r.id);

    if (rmName) {
      const rm = await prisma.user.findFirst({ where: { userId: rmName } });
      if (rm) {
        await prisma.releaseStakeholder.upsert({
          where: { releaseId_userId: { releaseId: r.id, userId: rm.id } },
          update: {},
          create: { releaseId: r.id, userId: rm.id },
        });
      }
    }

    const bsName = row["Stakeholder IDs"];
    if (bsName) {
      const bsIds = bsName.split(",").map((s: string) => s.trim()).filter((s: string) => s);
      for (const bsId of bsIds) {
        const bs = await prisma.user.findFirst({ where: { userId: bsId } });
        if (bs) {
          await prisma.releaseStakeholder.upsert({
            where: { releaseId_userId: { releaseId: r.id, userId: bs.id } },
            update: {},
            create: { releaseId: r.id, userId: bs.id },
          });
        }
      }
    }

    const appsList = (row["Application"] || "").split(",").map((s: string) => s.trim()).filter((s: string) => s);
    for (const appName of appsList) {
      if (!appMap.has(appName)) {
        const a = await prisma.application.upsert({
          where: { name_departmentId: { name: appName, departmentId: deptMap.get(deptName)! } },
          update: { departmentId: deptMap.get(deptName)! },
          create: { 
            name: appName, 
            departmentId: deptMap.get(deptName)!,
            type: "TBD",
            productOwner: "TBD",
            techLead: "TBD",
            support: "TBD",
            criticality: "Medium"
          },
        });
        appMap.set(appName, a.id);
      }
      await prisma.releaseApplication.upsert({
        where: { releaseId_applicationId: { releaseId: r.id, applicationId: appMap.get(appName)! } },
        update: {},
        create: { releaseId: r.id, applicationId: appMap.get(appName)! },
      });
    }
  }

  console.log("Upserting dependencies...");
  // Clear existing dependencies so we can recreate them with the proper Dep ID
  await prisma.releaseDependency.deleteMany({});
  for (const row of depsData) {
    const relId = releaseMap.get(row["Release ID"]);
    const depRelId = releaseMap.get(row["Depends On Release"]);
    if (!relId || !depRelId) continue;
    
    await prisma.releaseDependency.create({
      data: {
        id: row["Dep ID"] || undefined,
        releaseId: relId,
        dependsOnReleaseId: depRelId,
        dependencyType: row["Dependency Type"] || "Unknown",
        status: row["Status"] || "Unknown",
        impactIfBlocked: row["Impact if Blocked"],
        notes: row["Notes"],
      }
    });
  }

  console.log("Upserting env bookings...");
  for (const row of bookingsData) {
    const code = row["Booking ID"];
    if (!code) continue;
    const appId = appMap.get(row["Application"]);
    const relId = row["Release ID"] ? (releaseMap.get(row["Release ID"]) || null) : null;
    if (!appId) continue;

    // Resolve environment ID from env codes in the booking
    const resolvedEnvId = envMap.get(row["Test Env"]) || envMap.get(row["UAT Env"]) || envMap.get(row["Pre-Prod Env"]) || undefined;

    // Use earliest available date as fromDate, latest as toDate
    const fromDate = parseExcelDate(row["Test Start"]) || parseExcelDate(row["Prod Release Date"]) || new Date();
    const toDate = parseExcelDate(row["Pre-Prod End"]) || parseExcelDate(row["UAT End"]) || parseExcelDate(row["Test End"]) || fromDate;

    const data = {
      applicationId: appId,
      environmentId: resolvedEnvId,
      releaseId: relId || undefined,
      fromDate,
      toDate,
      bookedBy: row["Booked By"] ?? "System",
      team: row["Department"] ?? "Unknown",
      purpose: row["Notes"] || "Testing",
      status: "Approved",
      conflictFlag: row["Conflict Flag"] === "Yes" || row["Conflict Flag"] === "⚠️ CONFLICT",
      // All env-phase fields from the Excel
      releaseSize:    row["Release Size"] ?? null,
      prodReleaseDate: parseExcelDate(row["Prod Release Date"]),
      cabDate:        parseExcelDate(row["CAB Date"]),
      testEnvCode:    row["Test Env"] ?? null,
      testStart:      parseExcelDate(row["Test Start"]),
      testEnd:        parseExcelDate(row["Test End"]),
      testDays:       row["Test Days"] ? parseInt(String(row["Test Days"])) : null,
      uatEnvCode:     row["UAT Env"] ?? null,
      uatStart:       parseExcelDate(row["UAT Start"]),
      uatEnd:         parseExcelDate(row["UAT End"]),
      uatDays:        row["UAT Days"] ? parseInt(String(row["UAT Days"])) : null,
      preProdEnvCode: row["Pre-Prod Env"] ?? null,
      preProdStart:   parseExcelDate(row["Pre-Prod Start"]),
      preProdEnd:     parseExcelDate(row["Pre-Prod End"]),
      preProdDays:    row["Pre-Prod Days"] ? parseInt(String(row["Pre-Prod Days"])) : null,
    };
    await prisma.envBooking.upsert({
      where: { id: code },
      update: data,
      create: { id: code, ...data },
    });
  }

  console.log("Upserting risks...");
  for (const row of risksData) {
    const code = row["Risk ID"];
    if (!code) continue;
    const relId = releaseMap.get(row["Release ID"]);
    if (!relId) continue;
    // Excel uses "Risk Owner ID" column for the user lookup
    const riskOwnerUserId = row["Risk Owner ID"];
    let ownerId: string | null = null;
    if (riskOwnerUserId) {
      ownerId = usersMap.get(riskOwnerUserId) || null;
      if (!ownerId) {
        const u = await prisma.user.findFirst({ where: { userId: riskOwnerUserId } });
        if (u) ownerId = u.id;
      }
    }
    const riskFields = {
      releaseId: relId,
      category:           row["Risk Category"]     || "General",
      description:        row["Risk Description"]  || "Unknown risk",
      likelihood:         parseScore(row["Likelihood"]),         // was: "Probability"
      impact:             parseScore(row["Impact"]),
      riskScore:          parseScore(row["Risk Score"]),
      affectedArea:       row["Affected Area"]      ?? null,
      mitigationStrategy: row["Mitigation Strategy"] ?? null,   // was: "Mitigation Plan"
      riskOwnerId:        ownerId,
      status:             row["Status"]             || "Open",
      notes:              row["Notes"]              ?? null,
    };
    await prisma.risk.upsert({
      where: { riskCode: code },
      update: riskFields,
      create: { riskCode: code, ...riskFields },
    });
  }

  console.log("Upserting drifts...");
  for (const row of driftsData) {
    const code = row["Drift ID"];
    if (!code) continue;
    const relId = row["Release ID"] ? (releaseMap.get(row["Release ID"]) || null) : null;
    const appId = appMap.get(row["Application"]);
    if (!appId || !relId) continue;
    const driftFields = {
      releaseId:        relId,
      applicationId:    appId,
      environmentName:  row["Environment"]      || "Unknown",
      driftType:        row["Drift Type"]       || "Unknown",
      driftCategory:    row["Drift Category"]   ?? null,    // was: "Category"
      detectedDate:     parseExcelDate(row["Detected Date"]) || new Date(),
      severity:         row["Severity"]         || "Medium",
      description:      row["Description"]      || "",
      impactOnRelease:  row["Impact on Release"] ?? null,
      remediationAction: row["Remediation Action"] ?? null, // was: "Resolution Plan"
      status:           row["Status"]           || "Open",
      etaToFix:         parseExcelDate(row["ETA to Fix"]),  // was: "Target Fix Date"
    };
    await prisma.drift.upsert({
      where: { driftCode: code },
      update: driftFields,
      create: { driftCode: code, ...driftFields },
    });
  }

  console.log("Upserting approvals...");
  for (const row of approvalsData) {
    const code = row["Approval ID"];
    if (!code) continue;
    const relId = releaseMap.get(row["Release ID"]);
    if (!relId) continue;
    let approverId = usersMap.get(row["Approver ID"]);
    if (!approverId) {
      const u = await prisma.user.findFirst({ where: { userId: row["Approver ID"] } });
      if (u) approverId = u.id;
      else continue;
    }
    await prisma.approval.upsert({
      where: { approvalCode: code },
      update: {
        releaseId: relId,
        approvalType: row["Approval Type"] || "General",
        approverId,
        submittedDate: parseExcelDate(row["Submitted Date"]) || new Date(),
        decisionDate: parseExcelDate(row["Decision Date"]),
        decision: row["Decision"] || "Pending",
        comments: row["Comments"],
        cabMeetingId: row["CAB Meeting ID"],
      },
      create: {
        approvalCode: code,
        releaseId: relId,
        approvalType: row["Approval Type"] || "General",
        approverId,
        submittedDate: parseExcelDate(row["Submitted Date"]) || new Date(),
        decisionDate: parseExcelDate(row["Decision Date"]),
        decision: row["Decision"] || "Pending",
        comments: row["Comments"],
        cabMeetingId: row["CAB Meeting ID"],
      }
    });
  }

  console.log("Upserting leaves...");
  for (const row of leavesData) {
    const code = row["Leave ID"];
    if (!code) continue;
    let uId = usersMap.get(row["User ID"]);
    if (!uId) continue;
    const l = await prisma.leaveRecord.upsert({
      where: { leaveCode: code },
      update: {
        userId: uId,
        leaveStart: parseExcelDate(row["Leave Start"]) || new Date(),
        leaveEnd: parseExcelDate(row["Leave End"]) || new Date(),
        leaveType: row["Leave Type"] || "Annual",
        days: row["Days"] ? parseInt(row["Days"].toString()) : 1,
        riskImpact: row["Risk Impact"],
        riskScore: parseScore(row["Risk Score"]),
      },
      create: {
        leaveCode: code,
        userId: uId,
        leaveStart: parseExcelDate(row["Leave Start"]) || new Date(),
        leaveEnd: parseExcelDate(row["Leave End"]) || new Date(),
        leaveType: row["Leave Type"] || "Annual",
        days: row["Days"] ? parseInt(row["Days"].toString()) : 1,
        riskImpact: row["Risk Impact"],
        riskScore: parseScore(row["Risk Score"]),
      }
    });
    const relStr = row["Affected Release"];
    if (relStr) {
      const relCodes = relStr.split(",").map((s: string) => s.trim()).filter((s: string) => s);
      for (const rc of relCodes) {
        const rid = releaseMap.get(rc);
        if (rid) {
          await prisma.leaveRecordRelease.upsert({
            where: { leaveRecordId_releaseId: { leaveRecordId: l.id, releaseId: rid } },
            update: {},
            create: { leaveRecordId: l.id, releaseId: rid },
          });
        }
      }
    }
  }

  console.log("Upserting calendar events...");
  await prisma.calendarEvent.deleteMany({});
  for (const row of calendarData) {
    if (!row["Event Type"]) continue;
    const relCode = row["Release ID"];
    let relId: string | null = null;
    if (relCode && relCode !== "-") {
      const found = releaseMap.get(relCode);
      relId = found !== undefined ? found : null;
    }
    const date = parseExcelDate(row["Date"]) || new Date();
    await prisma.calendarEvent.create({
      data: {
        date,
        eventType: row["Event Type"],
        releaseId: relId,
        title: row["Release Name"] || row["Event Type"],
        departmentName: row["Department"] !== "ALL" ? (row["Department"] ?? null) : null,
        sizeImpact: row["Size/Impact"] ?? null,
        notes: row["Notes"] ?? null,
      }
    });
  }

  console.log("Excel seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
