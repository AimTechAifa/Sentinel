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

async function main() {
  console.log("Loading Excel file...");
  const filePath = path.join(__dirname, "ReleaseDesk_SampleData (1).xlsx");
  const wb = xlsx.readFile(filePath);

  const getSheetData = (sheetName: string, range?: number) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn(`Warning: Sheet "${sheetName}" not found!`);
      return [];
    }
    return xlsx.utils.sheet_to_json<any>(ws, { range });
  };

  console.log("Wiping existing data...");
  await prisma.leaveRecordRelease.deleteMany({});
  await prisma.leaveRecord.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.drift.deleteMany({});
  await prisma.risk.deleteMany({});
  await prisma.envBooking.deleteMany({});
  await prisma.releaseDependency.deleteMany({});
  await prisma.releaseStakeholder.deleteMany({});
  await prisma.releaseApplication.deleteMany({});
  await prisma.release.deleteMany({});
  await prisma.environmentVersion.deleteMany({});
  await prisma.environment.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  const usersData = getSheetData("Users", 0);
  const refDataRaw = xlsx.utils.sheet_to_json<any>(wb.Sheets["Reference Data"], { header: 1 });
  
  // 1. Department
  console.log("Seeding Departments...");
  let deptHeaderIdx = -1;
  for (let i = 0; i < refDataRaw.length; i++) {
    if (refDataRaw[i][0] === "Dept ID" && refDataRaw[i][1] === "Dept Code") {
      deptHeaderIdx = i; break;
    }
  }

  const deptsToCreate: any[] = [];
  if (deptHeaderIdx !== -1) {
    for (let i = deptHeaderIdx + 1; i < refDataRaw.length; i++) {
      const row = refDataRaw[i];
      if (!row || !row[0]) break; // empty row marks end of block
      
      const deptName = row[2];
      // Find head from Users data
      const executiveUser = usersData.find(u => u["Department"] === deptName && u["Access Level"] === "Executive");
      
      deptsToCreate.push({
        name: deptName,
        head: executiveUser ? executiveUser["Name"] : "Unassigned"
      });
    }
  }

  const deptMap = new Map<string, string>();
  for (const d of deptsToCreate) {
    const created = await prisma.department.create({ data: d });
    deptMap.set(created.name, created.id);
  }

  // 2. User
  console.log("Seeding Users...");
  const userMap = new Map<string, string>();
  const userNameMap = new Map<string, string>();
  for (const r of usersData) {
    const deptId = deptMap.get(r["Department"]);
    const created = await prisma.user.create({
      data: {
        userId: r["User ID"],
        name: r["Name"],
        email: r["Email"],
        role: r["Role"],
        department: r["Department"],
        manager: r["Manager"],
        accessLevel: r["Access Level"],
        status: r["Status"],
        lastLogin: parseExcelDate(r["Last Login"])
      }
    });
    userMap.set(r["User ID"], created.id);
    userNameMap.set(r["User ID"], created.name);
  }

  // 3. Application + Environment
  console.log("Seeding Applications and Environments...");
  const appsData = getSheetData("Applications", 0);
  
  const appMap = new Map<string, string>();
  const envMap = new Map<string, string>();
  let totalEnvRows = 0;
  
  let currentDeptName = "";
  let currentAppOwner = "";
  let currentTechLead = "";

  for (const r of appsData) {
    if (r["Department"]) currentDeptName = r["Department"];
    if (r["Application Owner"]) currentAppOwner = r["Application Owner"];
    if (r["Tech Lead"]) currentTechLead = r["Tech Lead"];

    const appName = r["Application"];
    if (!appName) continue;

    const deptId = deptMap.get(currentDeptName);
    if (!deptId) continue;

    let appId = appMap.get(appName);
    if (!appId) {
      const app = await prisma.application.create({
        data: {
          name: appName,
          departmentId: deptId,
          productOwner: currentAppOwner || "Unknown",
          techLead: currentTechLead || "Unknown",
          type: "Business Application", 
          support: `${currentDeptName} Support Team`, 
          criticality: "Medium", 
        }
      });
      appId = app.id;
      appMap.set(appName, appId);
    }
    
    const envName = r["Env"];
    if (envName) {
      const env = await prisma.environment.create({
        data: {
          applicationId: appId,
          name: envName,
          type: envName,
          owner: r["Env Owner"] || "Unknown",
          status: "Active"
        }
      });
      envMap.set(`${appId}_${envName}`, env.id);
      totalEnvRows++;
    }
  }

  // 4. EnvironmentVersion
  console.log("Seeding Environment Versions...");
  const versionsData = getSheetData("Versions", 0);
  for (const r of versionsData) {
    const appName = r["Application"];
    const envName = r["Environment"];
    const appId = appMap.get(appName);
    if (!appId) continue;
    const envId = envMap.get(`${appId}_${envName}`);
    if (!envId) continue;
    
    await prisma.environmentVersion.create({
      data: {
        applicationId: appId,
        environmentId: envId,
        version: r["Version"]?.toString() || "Unknown",
        buildNumber: r["Build Number"]?.toString(),
        deployDate: parseExcelDate(r["Deploy Date"]),
        updatedBy: r["Deployed By"],
        status: r["Status"],
        notes: r["Notes"]
      }
    });
  }

  // 5. Release
  console.log("Seeding Releases...");
  const releasesData = getSheetData("Releases", 0);
  const releaseMap = new Map<string, string>(); 
  for (const r of releasesData) {
    const code = r["Release ID"];
    const deptId = deptMap.get(r["Department"]);
    const ownerId = userMap.get(r["Release Owner ID"]);
    const ownerName = userNameMap.get(r["Release Owner ID"]) || "Unknown";
    
    const conflictStr = r["Conflict Flag"];
    const conflictFlag = conflictStr === "⚠️ CONFLICT" || (!!conflictStr && String(conflictStr).trim().length > 0);
    
    if (!deptId) continue;

    const release = await prisma.release.create({
      data: {
        releaseCode: code,
        name: r["Release Name"],
        departmentId: deptId,
        releaseSize: r["Release Size"],
        impact: r["Impact"] || "Medium",
        priority: r["Priority"] || "Medium",
        cabDate: parseExcelDate(r["CAB Date"]),
        startDate: parseExcelDate(r["Start Date"]),
        releaseDate: parseExcelDate(r["End Date"]) || new Date(), 
        testEnvRequired: r["Test Env Required"],
        uatEnvRequired: r["UAT Env Required"],
        status: r["Status"] || "Draft",
        conflictFlag,
        notes: r["Notes"],
        readinessPercent: r["Readiness %"] ? parseFloat(r["Readiness %"]) : null,
        blockers: r["Blockers"],
        vendorMaintenance: r["Vendor Maintenance"],
        changeFreeze: r["Change Freeze"],
        regulatory: r["Regulatory"],
        releaseOwnerId: ownerId,
        owner: ownerName,
        approvalStatus: r["Approval Status"],
        rollbackPlan: r["Rollback Plan"],
        goLiveChecklistPercent: r["Go-Live Checklist %"] ? parseFloat(r["Go-Live Checklist %"]) : null,
        deploymentWindow: r["Deployment Window"]
      }
    });
    releaseMap.set(code, release.id);
    
    const appName = r["Application"];
    const appId = appMap.get(appName);
    if (appId) {
      await prisma.releaseApplication.create({
        data: { releaseId: release.id, applicationId: appId }
      });
    }
    
    const stakeholdersStr = r["Stakeholder IDs"];
    if (stakeholdersStr) {
      const stakeholders = stakeholdersStr.toString().split(",").map((s: string) => s.trim()).filter(Boolean);
      const uniqueStakeholders = Array.from(new Set(stakeholders));
      for (const sh of uniqueStakeholders) {
        const uid = userMap.get(sh as string);
        if (uid) {
          await prisma.releaseStakeholder.create({
            data: { releaseId: release.id, userId: uid }
          });
        }
      }
    }
  }

  // 6. ReleaseDependency
  console.log("Seeding Release Dependencies...");
  const depsData = getSheetData("Dependencies", 2);
  let depsCount = 0;
  for (const r of depsData) {
    const relId = releaseMap.get(r["Release ID"]);
    const depId = releaseMap.get(r["Depends On Release"]);
    if (relId && depId) {
      await prisma.releaseDependency.create({
        data: {
          releaseId: relId,
          dependsOnReleaseId: depId,
          dependencyType: r["Dependency Type"],
          status: r["Status"],
          impactIfBlocked: r["Impact if Blocked"],
          notes: r["Notes"]
        }
      });
      depsCount++;
    }
  }

  // 7. EnvBooking
  console.log("Seeding EnvBookings...");
  const bookingsData = getSheetData("Env booking", 0);
  let bookingCount = 0;
  for (const r of bookingsData) {
    const relId = releaseMap.get(r["Release ID"]);
    const appId = appMap.get(r["Application"]);
    if (!appId) continue;

    let bookedBy = "System";
    let team = r["Department"] || "Unknown";
    if (relId) {
       const rel = await prisma.release.findUnique({ where: { id: relId } });
       if (rel?.owner) bookedBy = rel.owner;
    }

    const testStart = parseExcelDate(r["Test Start"]);
    const uatStart = parseExcelDate(r["UAT Start"]);
    const preProdStart = parseExcelDate(r["Pre-Prod Start"]);
    const testEnd = parseExcelDate(r["Test End"]);
    const uatEnd = parseExcelDate(r["UAT End"]);
    const preProdEnd = parseExcelDate(r["Pre-Prod End"]);
    const prodReleaseDate = parseExcelDate(r["Prod Release Date"]);
    
    const startDates = [testStart, uatStart, preProdStart].filter(d => d !== null) as Date[];
    const fromDate = startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : new Date();
    
    const endDates = [preProdEnd, prodReleaseDate].filter(d => d !== null) as Date[];
    const toDate = endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date();
    
    const conflictStr = r["Conflict Flag"];
    const conflictFlag = conflictStr === "⚠️ CONFLICT" || (!!conflictStr && String(conflictStr).trim().length > 0);

    await prisma.envBooking.create({
      data: {
        releaseId: relId,
        applicationId: appId,
        environmentId: null,
        releaseSize: r["Release Size"],
        prodReleaseDate,
        cabDate: parseExcelDate(r["CAB Date"]),
        testEnvCode: r["Test Env"],
        testStart,
        testEnd,
        testDays: r["Test Days"] ? parseInt(r["Test Days"]) : null,
        uatEnvCode: r["UAT Env"],
        uatStart,
        uatEnd,
        uatDays: r["UAT Days"] ? parseInt(r["UAT Days"]) : null,
        preProdEnvCode: r["Pre-Prod Env"],
        preProdStart,
        preProdEnd,
        preProdDays: r["Pre-Prod Days"] ? parseInt(r["Pre-Prod Days"]) : null,
        conflictFlag,
        purpose: r["Notes"],
        bookedBy,
        team,
        fromDate,
        toDate,
      }
    });
    bookingCount++;
  }

  // 8. Risk
  console.log("Seeding Risks...");
  const risksData = getSheetData("Risk", 3);
  let riskCount = 0;
  for (const r of risksData) {
    const code = r["Risk ID"];
    const relId = releaseMap.get(r["Release ID"]);
    if (!code || !relId) continue;

    await prisma.risk.create({
      data: {
        riskCode: code,
        releaseId: relId,
        category: r["Risk Category"] || "General",
        description: r["Risk Description"] || "Unknown",
        likelihood: parseInt(r["Likelihood"]) || 1,
        impact: parseInt(r["Impact"]) || 1,
        riskScore: parseInt(r["Risk Score"]) || 1,
        affectedArea: r["Affected Area"],
        mitigationStrategy: r["Mitigation Strategy"],
        riskOwnerId: userMap.get(r["Risk Owner ID"]),
        status: r["Status"] || "Open",
        notes: r["Notes"]
      }
    });
    riskCount++;
  }

  // 9. Drift
  console.log("Seeding Drifts...");
  const driftsData = getSheetData("Drift", 3);
  let driftCount = 0;
  for (const r of driftsData) {
    const code = r["Drift ID"];
    const relId = releaseMap.get(r["Release ID"]);
    const appId = appMap.get(r["Application"]);
    if (!code || !relId || !appId) continue;

    await prisma.drift.create({
      data: {
        driftCode: code,
        releaseId: relId,
        applicationId: appId,
        environmentName: r["Environment"] || "Unknown",
        driftType: r["Drift Type"] || "Unknown",
        driftCategory: r["Drift Category"],
        detectedDate: parseExcelDate(r["Detected Date"]) || new Date(),
        severity: r["Severity"] || "Medium",
        description: r["Description"] || "",
        impactOnRelease: r["Impact on Release"],
        remediationAction: r["Remediation Action"],
        status: r["Status"] || "Open",
        etaToFix: parseExcelDate(r["ETA to Fix"])
      }
    });
    driftCount++;
  }

  // 10. Approval
  console.log("Seeding Approvals...");
  const approvalsData = getSheetData("Approvals", 2);
  let approvalCount = 0;
  for (const r of approvalsData) {
    const code = r["Approval ID"];
    const relId = releaseMap.get(r["Release ID"]);
    const approverId = userMap.get(r["Approver ID"]);
    if (!code || !relId || !approverId) continue;

    await prisma.approval.create({
      data: {
        approvalCode: code,
        releaseId: relId,
        approvalType: r["Approval Type"] || "General",
        approverId: approverId,
        submittedDate: parseExcelDate(r["Submitted Date"]) || new Date(),
        decisionDate: parseExcelDate(r["Decision Date"]),
        decision: r["Decision"] || "Pending",
        comments: r["Comments"],
        cabMeetingId: r["CAB Meeting ID"]
      }
    });
    approvalCount++;
  }

  // 11. LeaveRecord + LeaveRecordRelease
  console.log("Seeding LeaveRecords...");
  const leavesData = getSheetData("Leave Calendar", 0);
  let leaveCount = 0;
  for (const r of leavesData) {
    const code = r["Leave ID"];
    const uid = userMap.get(r["User ID"]);
    if (!code || !uid) continue;

    const leaveRecord = await prisma.leaveRecord.create({
      data: {
        leaveCode: code,
        userId: uid,
        leaveStart: parseExcelDate(r["Leave Start"]) || new Date(),
        leaveEnd: parseExcelDate(r["Leave End"]) || new Date(),
        leaveType: r["Leave Type"] || "Annual Leave",
        days: parseInt(r["Days"]) || 1,
        riskImpact: r["Risk Impact"],
        riskScore: parseInt(r["Risk Score"]) || 0
      }
    });
    leaveCount++;

    const affectedRelStr = r["Affected Release"];
    if (affectedRelStr) {
      const relCodes = affectedRelStr.toString().split(",").map((s: string) => s.trim()).filter(Boolean);
      for (const rc of relCodes) {
        const rid = releaseMap.get(rc as string);
        if (rid) {
          await prisma.leaveRecordRelease.create({
            data: { leaveRecordId: leaveRecord.id, releaseId: rid }
          });
        }
      }
    }
  }

  console.log("\n================ SUMMARY ================");
  console.log(`Departments: ${deptMap.size} (Expected: 8)`);
  console.log(`Applications: ${appMap.size} (Expected: 84)`);
  console.log(`Environment Rows: ${totalEnvRows} (Expected: 504)`);
  console.log(`Users: ${userMap.size} (Expected: 100)`);
  console.log(`Releases: ${releaseMap.size} (Expected: 80)`);
  console.log(`EnvBookings: ${bookingCount} (Expected: 80+)`);
  console.log(`Risks: ${riskCount} (Expected: 31)`);
  console.log(`Drifts: ${driftCount} (Expected: 7)`);
  console.log(`Dependencies: ${depsCount} (Expected: 26)`);
  console.log(`Approvals: ${approvalCount} (Expected: 27)`);
  console.log(`LeaveRecords: ${leaveCount} (Expected: 30)`);
  console.log("=========================================\n");
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
