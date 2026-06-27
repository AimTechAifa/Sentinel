const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const flows = [
  { source: "Salesforce Sales Cloud", target: "SAP S/4HANA Finance (FICO)", notes: "Order-to-Cash Process (Real-time)" },
  { source: "SAP S/4HANA Finance (FICO)", target: "Workday HCM", notes: "Payroll & Financial Reporting (Daily)" },
  { source: "Workday HCM", target: "Okta Identity Cloud", notes: "Identity & Access Management (Real-time)" },
  { source: "SAP S/4HANA Manufacturing", target: "Blue Yonder WMS", notes: "Supply Chain Execution (Hourly)" },
  { source: "Blue Yonder WMS", target: "SAP Transportation Management (TM)", notes: "Logistics Coordination (Real-time)" },
  { source: "ServiceNow ITSM", target: "Splunk SIEM", notes: "Security Operations (Real-time)" },
  { source: "CrowdStrike Falcon", target: "Microsoft Sentinel", notes: "Security Monitoring (Real-time)" },
  { source: "DocuSign CLM", target: "SAP S/4HANA Finance (FICO)", notes: "Procurement & Legal (On-demand)" },
  { source: "Anaplan", target: "SAP S/4HANA Finance (FICO)", notes: "Financial Planning (Daily)" },
  { source: "Oracle HCM Cloud", target: "ADP Workforce Now", notes: "Payroll Processing (Bi-weekly)" },
  { source: "Salesforce Service Cloud", target: "Zendesk", notes: "Customer Service (Real-time)" },
  { source: "SAP S/4HANA Finance (FICO)", target: "IBM Cognos Analytics", notes: "Business Intelligence (Daily)" },
  { source: "ServiceNow ITSM", target: "CyberArk PAM", notes: "Privileged Access (Real-time)" },
  { source: "Workday HCM", target: "Cornerstone OnDemand", notes: "Learning Management (Daily)" },
  { source: "SAP Concur", target: "SAP S/4HANA Finance (FICO)", notes: "Expense Management (Daily)" }
];

async function main() {
  console.log("Seeding system mapping...");
  
  // 1. Create any missing applications and their PROD environments
  for (const flow of flows) {
    for (const appName of [flow.source, flow.target]) {
      let app = await prisma.application.findFirst({ where: { name: appName } });
      if (!app) {
        // Find or create an 'IT' department for fallback
        let dept = await prisma.department.findFirst({ where: { name: "IT" } });
        if (!dept) dept = await prisma.department.create({ data: { name: "IT", head: "TBD" } });
        
        app = await prisma.application.create({
          data: {
            name: appName,
            type: "System",
            productOwner: "TBD",
            techLead: "TBD",
            support: "TBD",
            criticality: "High",
            departmentId: dept.id,
          }
        });
      }
      // Ensure it has a Prod env
      let env = await prisma.environment.findFirst({ where: { applicationId: app.id, name: "Prod" } });
      if (!env) {
        await prisma.environment.create({
          data: {
            name: "Prod",
            type: "Production",
            owner: "TBD",
            status: "Active",
            applicationId: app.id,
          }
        });
      }
    }
  }

  // 2. Create the System Mapping Group
  let group = await prisma.systemMappingGroup.findFirst({ where: { name: "Enterprise Default Setup" } });
  if (group) {
    await prisma.systemMappingGroup.delete({ where: { id: group.id } });
  }
  
  group = await prisma.systemMappingGroup.create({
    data: {
      name: "Enterprise Default Setup",
      status: "accepted",
      sourceNotes: "Seeded from Integration Flow Architecture",
    }
  });

  // 3. Create the edges
  for (const flow of flows) {
    const srcApp = await prisma.application.findFirst({ where: { name: flow.source } });
    const tgtApp = await prisma.application.findFirst({ where: { name: flow.target } });
    const srcEnv = await prisma.environment.findFirst({ where: { applicationId: srcApp.id, name: "Prod" } });
    const tgtEnv = await prisma.environment.findFirst({ where: { applicationId: tgtApp.id, name: "Prod" } });
    
    await prisma.systemMappingEdge.create({
      data: {
        groupId: group.id,
        sourceAppId: srcApp.id,
        sourceEnvId: srcEnv.id,
        targetAppId: tgtApp.id,
        targetEnvId: tgtEnv.id,
        direction: "downstream",
        notes: flow.notes,
        isDefault: true,
      }
    });
  }

  console.log("System mapping seeded successfully.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
