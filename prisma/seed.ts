import { PrismaClient } from "@prisma/client";
import { seedLiveState } from "./seed-live-state";

const prisma = new PrismaClient();

const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

async function main() {
  await prisma.releaseHistoryEvent.deleteMany();
  await prisma.releaseDecisionState.deleteMany();
  await prisma.deploymentState.deleteMany();
  await prisma.appNotificationRow.deleteMany();
  await prisma.agentPauseState.deleteMany();
  await prisma.releaseAuditEvent.deleteMany();
  await prisma.releaseDependency.deleteMany();
  await prisma.releaseApplication.deleteMany();
  await prisma.envBooking.deleteMany();
  await prisma.systemMappingEdge.deleteMany();
  await prisma.systemMappingGroup.deleteMany();
  await prisma.p1Issue.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.release.deleteMany();
  await prisma.environmentVersion.deleteMany();
  await prisma.environment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.department.deleteMany();
  await prisma.connectorSync.deleteMany();

  const fin = await prisma.department.create({ data: { name: "FIN", head: "Guru Sharma" } });
  const platform = await prisma.department.create({ data: { name: "Platform", head: "Alex Kim" } });
  const crm = await prisma.department.create({ data: { name: "CRM", head: "Lisa Park" } });
  const security = await prisma.department.create({ data: { name: "Security", head: "Sarah Chen" } });
  const ops = await prisma.department.create({ data: { name: "Operations", head: "Emma Walsh" } });

  const sap = await prisma.application.create({
    data: {
      name: "SAP",
      departmentId: platform.id,
      type: "ERP",
      productOwner: "Lisa Park",
      techLead: "Jordan Lee",
      support: "Platform Ops",
      criticality: "Critical",
    },
  });
  const finApp = await prisma.application.create({
    data: {
      name: "FIN",
      departmentId: fin.id,
      type: "Finance",
      productOwner: "Guru Sharma",
      techLead: "Chris Nguyen",
      support: "FIN Support",
      criticality: "Critical",
    },
  });
  const crmApp = await prisma.application.create({
    data: {
      name: "CRM",
      departmentId: crm.id,
      type: "Customer",
      productOwner: "Lisa Park",
      techLead: "David Frost",
      support: "CRM Support",
      criticality: "High",
    },
  });
  const oracle = await prisma.application.create({
    data: {
      name: "Oracle",
      departmentId: ops.id,
      type: "Data Platform",
      productOwner: "Raj Patel",
      techLead: "Alex Kim",
      support: "Data Ops",
      criticality: "High",
    },
  });

  const sapDev = await prisma.environment.create({
    data: { applicationId: sap.id, name: "DEV SAP", type: "Dev", owner: "Jordan Lee", lastDbRefresh: daysAgo(7), status: "Available" },
  });
  const sapTest = await prisma.environment.create({
    data: { applicationId: sap.id, name: "TEST SAP", type: "Test", owner: "Jordan Lee", lastDbRefresh: daysAgo(3), status: "Available" },
  });
  const sapProd = await prisma.environment.create({
    data: { applicationId: sap.id, name: "PROD SAP", type: "Prod", owner: "Emma Walsh", lastDbRefresh: daysAgo(1), status: "Restricted" },
  });
  const finUat = await prisma.environment.create({
    data: { applicationId: finApp.id, name: "UAT Asset Mgmt", type: "UAT", owner: "Guru Sharma", lastDbRefresh: daysAgo(5), status: "Available" },
  });
  const oracleDev = await prisma.environment.create({
    data: { applicationId: oracle.id, name: "DEV Oracle", type: "Dev", owner: "Raj Patel", lastDbRefresh: daysAgo(10), status: "Available" },
  });
  const crmDev = await prisma.environment.create({
    data: { applicationId: crmApp.id, name: "DEV CRM", type: "Dev", owner: "David Frost", lastDbRefresh: daysAgo(4), status: "Available" },
  });

  const defaultGroup = await prisma.systemMappingGroup.create({
    data: {
      name: "Default enterprise setup",
      status: "accepted",
      sourceNotes: "Seeded demo mappings for SAP, FIN, Oracle, and CRM integration paths.",
    },
  });

  await prisma.systemMappingEdge.createMany({
    data: [
      {
        groupId: defaultGroup.id,
        sourceAppId: sap.id,
        sourceEnvId: sapTest.id,
        targetAppId: finApp.id,
        targetEnvId: finUat.id,
        direction: "downstream",
        notes: "FIN UAT consumes TEST SAP interfaces for SIT and UAT cycles.",
        isDefault: true,
      },
      {
        groupId: defaultGroup.id,
        sourceAppId: sap.id,
        sourceEnvId: sapTest.id,
        targetAppId: oracle.id,
        targetEnvId: oracleDev.id,
        direction: "downstream",
        notes: "Ledger replication from SAP TEST to Oracle DEV for reconciliation.",
        isDefault: true,
      },
      {
        groupId: defaultGroup.id,
        sourceAppId: finApp.id,
        sourceEnvId: finUat.id,
        targetAppId: crmApp.id,
        targetEnvId: crmDev.id,
        direction: "downstream",
        notes: "Customer billing events feed CRM DEV during end-to-end tests.",
        isDefault: false,
      },
    ],
  });

  const rel2140 = await prisma.release.create({
    data: {
      releaseCode: "RD-2026-0140",
      name: "Platform Release",
      programProject: "Core Banking Transformation",
      owner: "Priya Sharma",
      status: "At Risk",
      releaseDate: daysFromNow(1),
      priority: "High",
      impact: "High",
      departmentId: platform.id,
      applications: { create: [{ applicationId: sap.id }] },
    },
  });

  const rel2135 = await prisma.release.create({
    data: {
      releaseCode: "RD-2026-0135",
      name: "Billing Hotfix",
      programProject: "N/A",
      owner: "Alex Kim",
      status: "Blocked",
      releaseDate: daysFromNow(3),
      priority: "High",
      impact: "Medium",
      departmentId: fin.id,
      applications: { create: [{ applicationId: finApp.id }] },
    },
  });

  const rel2150 = await prisma.release.create({
    data: {
      releaseCode: "RD-2026-0150",
      name: "Search Enhancement",
      programProject: "Digital CRM",
      owner: "Priya Sharma",
      status: "In Progress",
      releaseDate: daysFromNow(7),
      priority: "Medium",
      impact: "Medium",
      departmentId: crm.id,
      applications: { create: [{ applicationId: crmApp.id }] },
    },
  });

  const rel2141 = await prisma.release.create({
    data: {
      releaseCode: "RD-2026-0141",
      name: "Mobile App Release",
      programProject: "Digital CRM",
      owner: "Nina Okonkwo",
      status: "Ready",
      releaseDate: daysFromNow(2),
      priority: "Low",
      impact: "Low",
      departmentId: crm.id,
      decision: "Go",
      notes: "Low-risk mobile patch — all gates green.",
      applications: { create: [{ applicationId: crmApp.id }] },
    },
  });

  const rel2138 = await prisma.release.create({
    data: {
      releaseCode: "RD-2026-0138",
      name: "Identity Patch",
      programProject: "Security Hardening",
      owner: "Sarah Chen",
      status: "Scheduled",
      releaseDate: daysFromNow(5),
      priority: "Medium",
      impact: "Medium",
      departmentId: security.id,
      applications: { create: [{ applicationId: sap.id }] },
    },
  });

  const rel2120 = await prisma.release.create({
    data: {
      releaseCode: "RD-2026-0120",
      name: "Core Platform Patch",
      programProject: "Core Banking Transformation",
      owner: "Jordan Lee",
      status: "Shipped",
      releaseDate: daysAgo(8),
      priority: "Medium",
      impact: "Medium",
      departmentId: platform.id,
      decision: "Go",
      applications: { create: [{ applicationId: sap.id }, { applicationId: oracle.id }] },
    },
  });

  const rel2160 = await prisma.release.create({
    data: {
      releaseCode: "RD-2026-0160",
      name: "Payments API Hardening",
      programProject: "Core Banking Transformation",
      owner: "Emma Walsh",
      status: "Planned",
      releaseDate: daysFromNow(14),
      priority: "High",
      impact: "High",
      departmentId: platform.id,
      applications: { create: [{ applicationId: sap.id }] },
    },
  });

  await prisma.releaseDependency.createMany({
    data: [
      { releaseId: rel2150.id, dependsOnReleaseId: rel2140.id },
      { releaseId: rel2160.id, dependsOnReleaseId: rel2140.id },
    ],
  });

  await prisma.releaseAuditEvent.createMany({
    data: [
      { releaseId: rel2140.id, action: "status_change", actor: "Priya Sharma", detail: "Marked At Risk — SAP TEST booking conflict" },
      { releaseId: rel2135.id, action: "decision", actor: "Alex Kim", detail: "No-Go — build #4468 failing integration tests" },
      { releaseId: rel2141.id, action: "decision", actor: "Nina Okonkwo", detail: "Go — all gates green for mobile patch" },
      { releaseId: rel2120.id, action: "status_change", actor: "Jordan Lee", detail: "Shipped to production — smoke tests passed" },
    ],
  });

  await prisma.envBooking.create({
    data: {
      applicationId: sap.id,
      environmentId: sapTest.id,
      bookedBy: "Guru Sharma",
      team: "FIN",
      departmentName: "FIN",
      fromDate: daysFromNow(14),
      toDate: daysFromNow(28),
      purpose: "FIN SIT 1",
      releaseId: rel2140.id,
      status: "BOOKED",
    },
  });

  await prisma.envBooking.create({
    data: {
      applicationId: finApp.id,
      environmentId: finUat.id,
      bookedBy: "Guru Sharma",
      team: "FIN",
      departmentName: "FIN",
      fromDate: daysFromNow(14),
      toDate: daysFromNow(28),
      purpose: "FIN SIT 1 — coupled testing",
      status: "BOOKED",
    },
  });

  await prisma.envBooking.create({
    data: {
      applicationId: sap.id,
      environmentId: sapTest.id,
      bookedBy: "Alex Kim",
      team: "Platform",
      departmentName: "Platform",
      fromDate: daysFromNow(12),
      toDate: daysFromNow(26),
      purpose: "Platform regression — overlaps FIN SIT window",
      releaseId: rel2140.id,
      status: "BOOKED",
    },
  });

  await prisma.envBooking.create({
    data: {
      applicationId: crmApp.id,
      environmentId: crmDev.id,
      bookedBy: "David Frost",
      team: "CRM",
      departmentName: "CRM",
      fromDate: daysFromNow(5),
      toDate: daysFromNow(12),
      purpose: "Search enhancement integration",
      releaseId: rel2150.id,
      status: "BOOKED",
    },
  });

  await prisma.environmentVersion.createMany({
    data: [
      { applicationId: sap.id, environmentId: sapDev.id, version: "2.15.0-dev", updatedBy: "Jordan Lee" },
      { applicationId: sap.id, environmentId: sapTest.id, version: "2.14.0", updatedBy: "Jordan Lee" },
      { applicationId: sap.id, environmentId: sapProd.id, version: "2.13.5", updatedBy: "Emma Walsh" },
      { applicationId: finApp.id, environmentId: finUat.id, version: "2.14.0", updatedBy: "Guru Sharma" },
      { applicationId: crmApp.id, environmentId: crmDev.id, version: "2.12.0-dev", updatedBy: "David Frost" },
      { applicationId: oracle.id, environmentId: oracleDev.id, version: "1.8.0-dev", updatedBy: "Raj Patel" },
    ],
  });

  await prisma.connectorSync.createMany({
    data: [
      { name: "Jira", lastSynced: daysAgo(0.04) },
      { name: "GitHub", lastSynced: daysAgo(0.02) },
      { name: "ServiceNow", lastSynced: daysAgo(0.08) },
      { name: "Confluence", lastSynced: daysAgo(0.12) },
    ],
  });

  await prisma.p1Issue.createMany({
    data: [
      {
        externalId: "JIRA-8842",
        title: "Payment routing timeout in production",
        application: "SAP",
        releaseCode: "RD-2026-0140",
        priority: "P1",
        status: "Open",
        source: "Jira",
      },
      {
        externalId: "JIRA-8851",
        title: "Invoice rounding mismatch — hotfix candidate",
        application: "FIN",
        releaseCode: "RD-2026-0135",
        priority: "P1",
        status: "In Progress",
        source: "Jira",
      },
      {
        externalId: "JIRA-8860",
        title: "Canary rollout error rate spike on payments-api",
        application: "SAP",
        releaseCode: "RD-2026-0140",
        priority: "P1",
        status: "Open",
        source: "Datadog",
      },
    ],
  });

  await prisma.workItem.createMany({
    data: [
      {
        externalId: "BILL-800",
        title: "Platform release — core billing epic",
        itemType: "Epic",
        releaseCode: "RD-2026-0140",
        status: "In Progress",
        assignee: "Priya Sharma",
        priority: "High",
        source: "Jira",
      },
      {
        externalId: "BILL-801",
        title: "SAP payment routing regression suite",
        itemType: "Story",
        releaseCode: "RD-2026-0140",
        status: "Done",
        assignee: "Jordan Lee",
        priority: "High",
        source: "Jira",
      },
      {
        externalId: "BILL-802",
        title: "FIN UAT sign-off scenarios",
        itemType: "Story",
        releaseCode: "RD-2026-0140",
        status: "In Progress",
        assignee: "Guru Sharma",
        priority: "Medium",
        source: "Jira",
      },
      {
        externalId: "BILL-803",
        title: "CRM downstream validation blocked on env",
        itemType: "Story",
        releaseCode: "RD-2026-0140",
        status: "Blocked",
        assignee: "David Frost",
        priority: "Medium",
        blockedBy: "BILL-802",
        source: "Jira",
      },
      {
        externalId: "FIN-893",
        title: "Hotfix — integration test failures on build #4468",
        itemType: "Bug",
        releaseCode: "RD-2026-0135",
        status: "Blocked",
        assignee: "Alex Kim",
        priority: "High",
        blockedBy: "FIN-890",
        source: "Jira",
      },
      {
        externalId: "FIN-890",
        title: "Invoice rounding mismatch root cause",
        itemType: "Bug",
        releaseCode: "RD-2026-0135",
        status: "In Progress",
        assignee: "Chris Nguyen",
        priority: "High",
        source: "Jira",
      },
      {
        externalId: "CRM-410",
        title: "Search index rebuild for enhancement",
        itemType: "Story",
        releaseCode: "RD-2026-0150",
        status: "In Progress",
        assignee: "David Frost",
        priority: "Medium",
        source: "Jira",
      },
      {
        externalId: "CRM-411",
        title: "Platform dependency gate — wait for RD-2026-0140",
        itemType: "Story",
        releaseCode: "RD-2026-0150",
        status: "Pending",
        assignee: "Priya Sharma",
        priority: "Medium",
        blockedBy: "BILL-800",
        source: "Jira",
      },
      {
        externalId: "PAY-120",
        title: "API hardening — security review stories",
        itemType: "Epic",
        releaseCode: "RD-2026-0160",
        status: "Planned",
        assignee: "Emma Walsh",
        priority: "High",
        source: "Jira",
      },
    ],
  });

  await seedLiveState(prisma);

  console.log("Release Desk seed complete (MVP + AI Command Center demo state).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
