-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isSystemGlobal" BOOLEAN NOT NULL DEFAULT false,
    "clerkOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deptCode" TEXT,
    "name" TEXT NOT NULL,
    "head" TEXT NOT NULL,
    "primaryFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "type" TEXT,
    "productOwner" TEXT NOT NULL,
    "techLead" TEXT NOT NULL,
    "support" TEXT,
    "criticality" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Environment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "lastDbRefresh" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "manager" TEXT,
    "accessLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "customFields" JSONB,
    "region" TEXT,
    "phone" TEXT,
    "specialization" TEXT,
    "rmStartDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdminProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "saCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "departmentName" TEXT,
    "accessScope" TEXT,
    "grantedDate" TIMESTAMP(3),
    "grantedBy" TEXT,
    "status" TEXT,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "linkedUserId" TEXT,

    CONSTRAINT "SuperAdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "releaseCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programProject" TEXT,
    "status" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "notes" TEXT,
    "decision" TEXT,
    "customFields" JSONB,
    "releaseSize" TEXT,
    "cabDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "testEnvRequired" TEXT,
    "uatEnvRequired" TEXT,
    "conflictFlag" BOOLEAN NOT NULL DEFAULT false,
    "readinessPercent" DOUBLE PRECISION,
    "blockers" TEXT,
    "vendorMaintenance" TEXT,
    "changeFreeze" TEXT,
    "regulatory" TEXT,
    "approvalStatus" TEXT,
    "rollbackPlan" TEXT,
    "goLiveChecklistPercent" DOUBLE PRECISION,
    "deploymentWindow" TEXT,
    "releaseOwnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseApplication" (
    "releaseId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "ReleaseApplication_pkey" PRIMARY KEY ("releaseId","applicationId")
);

-- CreateTable
CREATE TABLE "ReleaseDependency" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "dependsOnReleaseId" TEXT NOT NULL,
    "dependencyType" TEXT,
    "status" TEXT,
    "impactIfBlocked" TEXT,
    "notes" TEXT,

    CONSTRAINT "ReleaseDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseAuditEvent" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleaseAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvBooking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "environmentId" TEXT,
    "bookedBy" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "departmentName" TEXT,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "releaseId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "releaseSize" TEXT,
    "prodReleaseDate" TIMESTAMP(3),
    "cabDate" TIMESTAMP(3),
    "testEnvCode" TEXT,
    "testStart" TIMESTAMP(3),
    "testEnd" TIMESTAMP(3),
    "testDays" INTEGER,
    "uatEnvCode" TEXT,
    "uatStart" TIMESTAMP(3),
    "uatEnd" TIMESTAMP(3),
    "uatDays" INTEGER,
    "preProdEnvCode" TEXT,
    "preProdStart" TIMESTAMP(3),
    "preProdEnd" TIMESTAMP(3),
    "preProdDays" INTEGER,
    "conflictFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMappingGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "sourceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMappingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMappingEdge" (
    "id" TEXT NOT NULL,
    "groupId" TEXT,
    "sourceAppId" TEXT NOT NULL,
    "sourceEnvId" TEXT NOT NULL,
    "targetAppId" TEXT NOT NULL,
    "targetEnvId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemMappingEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemIntegration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceAppId" TEXT NOT NULL,
    "departmentName" TEXT,
    "systemType" TEXT,
    "integratesWith" TEXT NOT NULL,
    "dataFlow" TEXT,
    "keyDataExchanged" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "authType" TEXT NOT NULL,
    "baseUrl" TEXT,
    "credentials" TEXT NOT NULL,
    "config" JSONB,
    "pollInterval" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorSyncLog" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "recordsSynced" INTEGER DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "ConnectorSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "P1Issue" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "application" TEXT,
    "releaseCode" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'P1',
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "connectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "P1Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "releaseCode" TEXT,
    "status" TEXT NOT NULL,
    "assignee" TEXT,
    "priority" TEXT,
    "blockedBy" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Jira',
    "connectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseDecisionState" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "decision" TEXT,
    "rationale" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "overridden" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseDecisionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeploymentState" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "rollbackNarrative" TEXT,
    "rollbackReason" TEXT,
    "rolledBackAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeploymentState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseHistoryEvent" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "agent" TEXT,

    CONSTRAINT "ReleaseHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppNotificationRow" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "releaseId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,

    CONSTRAINT "AppNotificationRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPauseState" (
    "agentId" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPauseState_pkey" PRIMARY KEY ("agentId")
);

-- CreateTable
CREATE TABLE "ReleaseStakeholder" (
    "releaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ReleaseStakeholder_pkey" PRIMARY KEY ("releaseId","userId")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "riskCode" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "affectedArea" TEXT,
    "mitigationStrategy" TEXT,
    "riskOwnerId" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drift" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "driftCode" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "environmentName" TEXT NOT NULL,
    "driftType" TEXT NOT NULL,
    "driftCategory" TEXT,
    "detectedDate" TIMESTAMP(3) NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impactOnRelease" TEXT,
    "remediationAction" TEXT,
    "status" TEXT NOT NULL,
    "etaToFix" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "approvalCode" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3) NOT NULL,
    "decisionDate" TIMESTAMP(3),
    "decision" TEXT NOT NULL DEFAULT 'Pending',
    "comments" TEXT,
    "cabMeetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leaveCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveStart" TIMESTAMP(3) NOT NULL,
    "leaveEnd" TIMESTAMP(3) NOT NULL,
    "leaveType" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "riskImpact" TEXT,
    "riskScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRecordRelease" (
    "leaveRecordId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,

    CONSTRAINT "LeaveRecordRelease_pkey" PRIMARY KEY ("leaveRecordId","releaseId")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "releaseId" TEXT,
    "title" TEXT NOT NULL,
    "departmentName" TEXT,
    "sizeImpact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentVersion" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "updatedBy" TEXT,
    "buildNumber" TEXT,
    "deployDate" TIMESTAMP(3),
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringAlert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "alertCode" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT NOT NULL,
    "departmentName" TEXT,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "threshold" TEXT NOT NULL,
    "currentValue" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignedTo" TEXT,
    "environmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoringAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT NOT NULL,
    "departmentName" TEXT,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "impact" TEXT,
    "assignedTo" TEXT,
    "relatedReleaseId" TEXT,
    "environmentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusCheck" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "environmentName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastCheck" TIMESTAMP(3) NOT NULL,
    "uptimePercent" DOUBLE PRECISION,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationStatusCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedMaintenance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "maintenanceCode" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "applications" TEXT NOT NULL,
    "environments" TEXT NOT NULL,
    "departmentName" TEXT,
    "impact" TEXT,
    "requestor" TEXT,
    "approvalStatus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannedMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskFactorDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "factorName" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "scoreBest" TEXT,
    "scoreWorst" TEXT,
    "dataSource" TEXT,

    CONSTRAINT "RiskFactorDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseRiskMetric" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleaseRiskMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScoreThreshold" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" TEXT NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "colorCode" TEXT,
    "actionRequired" TEXT,
    "approvalLevel" TEXT,

    CONSTRAINT "RiskScoreThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskLikelihoodScale" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "probabilityRange" TEXT,
    "description" TEXT,

    CONSTRAINT "RiskLikelihoodScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskImpactScale" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "businessImpactRange" TEXT,
    "description" TEXT,

    CONSTRAINT "RiskImpactScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLAMetricDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "metricName" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "warning" TEXT NOT NULL,
    "critical" TEXT NOT NULL,
    "measurementFrequency" TEXT,

    CONSTRAINT "SLAMetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStageDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "entityType" TEXT NOT NULL,
    "stageCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "stage" TEXT,
    "sequence" INTEGER NOT NULL,
    "systemTag" TEXT NOT NULL,
    "colorCode" TEXT,
    "description" TEXT,

    CONSTRAINT "WorkflowStageDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalTypeDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "approvalType" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "approverRoleCode" TEXT,
    "slaHours" INTEGER,
    "sequence" INTEGER NOT NULL,
    "systemTag" TEXT,

    CONSTRAINT "ApprovalTypeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "roleName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "canCreateRelease" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "departmentScoped" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestingPhaseGate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "phaseName" TEXT NOT NULL,
    "environmentName" TEXT,
    "entryCriteria" TEXT,
    "exitCriteria" TEXT,
    "signOffRoleCode" TEXT,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "TestingPhaseGate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTypeDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "triggerEvent" TEXT NOT NULL,
    "recipients" TEXT[],
    "channels" TEXT[],

    CONSTRAINT "NotificationTypeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseSizeDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "size" TEXT NOT NULL,
    "testDays" INTEGER NOT NULL,
    "uatDays" INTEGER NOT NULL,
    "preProdDays" INTEGER NOT NULL,
    "totalLeadTime" TEXT,

    CONSTRAINT "ReleaseSizeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeFreezePeriod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "periodName" TEXT NOT NULL,
    "freezeType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "exceptions" TEXT,

    CONSTRAINT "ChangeFreezePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentTypeDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "envCode" TEXT NOT NULL,
    "envName" TEXT NOT NULL,
    "promotionOrder" INTEGER NOT NULL,
    "availability" TEXT,

    CONSTRAINT "EnvironmentTypeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeploymentWindowDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "windowName" TEXT NOT NULL,
    "day" TEXT,
    "timeRange" TEXT,
    "durationHours" DOUBLE PRECISION,
    "suitableFor" TEXT,

    CONSTRAINT "DeploymentWindowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedEnvironmentConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "environmentName" TEXT NOT NULL,
    "maxConcurrent" INTEGER NOT NULL,
    "contentionLevel" TEXT,

    CONSTRAINT "SharedEnvironmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedEnvironmentDepartment" (
    "id" TEXT NOT NULL,
    "sharedEnvironmentId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "SharedEnvironmentDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationCategoryDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isSystemDefault" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "tier" TEXT,
    "criticality" TEXT,
    "exampleApps" TEXT,

    CONSTRAINT "ApplicationCategoryDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_clerkOrgId_key" ON "Organization"("clerkOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_name_key" ON "Department"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Application_organizationId_departmentId_idx" ON "Application"("organizationId", "departmentId");

-- CreateIndex
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Application_organizationId_name_departmentId_key" ON "Application"("organizationId", "name", "departmentId");

-- CreateIndex
CREATE INDEX "Environment_applicationId_status_idx" ON "Environment"("applicationId", "status");

-- CreateIndex
CREATE INDEX "Environment_deletedAt_idx" ON "Environment"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Environment_applicationId_name_key" ON "Environment"("applicationId", "name");

-- CreateIndex
CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");

-- CreateIndex
CREATE INDEX "User_organizationId_status_idx" ON "User"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_userId_key" ON "User"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_email_key" ON "User"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminProfile_linkedUserId_key" ON "SuperAdminProfile"("linkedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminProfile_organizationId_saCode_key" ON "SuperAdminProfile"("organizationId", "saCode");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminProfile_organizationId_email_key" ON "SuperAdminProfile"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Release_organizationId_status_idx" ON "Release"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Release_organizationId_createdAt_idx" ON "Release"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Release_organizationId_departmentId_idx" ON "Release"("organizationId", "departmentId");

-- CreateIndex
CREATE INDEX "Release_organizationId_releaseOwnerId_idx" ON "Release"("organizationId", "releaseOwnerId");

-- CreateIndex
CREATE INDEX "Release_deletedAt_idx" ON "Release"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Release_organizationId_releaseCode_key" ON "Release"("organizationId", "releaseCode");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseDependency_releaseId_dependsOnReleaseId_key" ON "ReleaseDependency"("releaseId", "dependsOnReleaseId");

-- CreateIndex
CREATE INDEX "ReleaseAuditEvent_releaseId_createdAt_idx" ON "ReleaseAuditEvent"("releaseId", "createdAt");

-- CreateIndex
CREATE INDEX "EnvBooking_organizationId_releaseId_idx" ON "EnvBooking"("organizationId", "releaseId");

-- CreateIndex
CREATE INDEX "EnvBooking_environmentId_fromDate_toDate_idx" ON "EnvBooking"("environmentId", "fromDate", "toDate");

-- CreateIndex
CREATE INDEX "EnvBooking_applicationId_fromDate_toDate_idx" ON "EnvBooking"("applicationId", "fromDate", "toDate");

-- CreateIndex
CREATE INDEX "ConnectorSyncLog_connectorId_idx" ON "ConnectorSyncLog"("connectorId");

-- CreateIndex
CREATE INDEX "ConnectorSyncLog_connectorId_startedAt_idx" ON "ConnectorSyncLog"("connectorId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "P1Issue_externalId_key" ON "P1Issue"("externalId");

-- CreateIndex
CREATE INDEX "P1Issue_status_idx" ON "P1Issue"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkItem_externalId_key" ON "WorkItem"("externalId");

-- CreateIndex
CREATE INDEX "WorkItem_releaseCode_idx" ON "WorkItem"("releaseCode");

-- CreateIndex
CREATE INDEX "WorkItem_status_idx" ON "WorkItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseDecisionState_releaseId_key" ON "ReleaseDecisionState"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentState_releaseId_key" ON "DeploymentState"("releaseId");

-- CreateIndex
CREATE INDEX "ReleaseHistoryEvent_releaseId_idx" ON "ReleaseHistoryEvent"("releaseId");

-- CreateIndex
CREATE INDEX "ReleaseHistoryEvent_releaseId_timestamp_idx" ON "ReleaseHistoryEvent"("releaseId", "timestamp");

-- CreateIndex
CREATE INDEX "Risk_releaseId_idx" ON "Risk"("releaseId");

-- CreateIndex
CREATE INDEX "Risk_organizationId_status_idx" ON "Risk"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Risk_organizationId_riskCode_key" ON "Risk"("organizationId", "riskCode");

-- CreateIndex
CREATE INDEX "Drift_releaseId_idx" ON "Drift"("releaseId");

-- CreateIndex
CREATE INDEX "Drift_applicationId_idx" ON "Drift"("applicationId");

-- CreateIndex
CREATE INDEX "Drift_organizationId_status_idx" ON "Drift"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Drift_organizationId_driftCode_key" ON "Drift"("organizationId", "driftCode");

-- CreateIndex
CREATE INDEX "Approval_releaseId_idx" ON "Approval"("releaseId");

-- CreateIndex
CREATE INDEX "Approval_organizationId_decision_idx" ON "Approval"("organizationId", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_organizationId_approvalCode_key" ON "Approval"("organizationId", "approvalCode");

-- CreateIndex
CREATE INDEX "LeaveRecord_userId_idx" ON "LeaveRecord"("userId");

-- CreateIndex
CREATE INDEX "LeaveRecord_organizationId_leaveStart_leaveEnd_idx" ON "LeaveRecord"("organizationId", "leaveStart", "leaveEnd");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveRecord_organizationId_leaveCode_key" ON "LeaveRecord"("organizationId", "leaveCode");

-- CreateIndex
CREATE INDEX "CalendarEvent_releaseId_idx" ON "CalendarEvent"("releaseId");

-- CreateIndex
CREATE INDEX "CalendarEvent_organizationId_date_idx" ON "CalendarEvent"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "EnvironmentVersion_applicationId_environmentId_key" ON "EnvironmentVersion"("applicationId", "environmentId");

-- CreateIndex
CREATE INDEX "MonitoringAlert_applicationId_idx" ON "MonitoringAlert"("applicationId");

-- CreateIndex
CREATE INDEX "MonitoringAlert_organizationId_timestamp_idx" ON "MonitoringAlert"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "MonitoringAlert_organizationId_status_idx" ON "MonitoringAlert"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringAlert_organizationId_alertCode_key" ON "MonitoringAlert"("organizationId", "alertCode");

-- CreateIndex
CREATE INDEX "Incident_applicationId_idx" ON "Incident"("applicationId");

-- CreateIndex
CREATE INDEX "Incident_relatedReleaseId_idx" ON "Incident"("relatedReleaseId");

-- CreateIndex
CREATE INDEX "Incident_organizationId_timestamp_idx" ON "Incident"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "Incident_organizationId_status_idx" ON "Incident"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_organizationId_incidentCode_key" ON "Incident"("organizationId", "incidentCode");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationStatusCheck_applicationId_environmentName_key" ON "ApplicationStatusCheck"("applicationId", "environmentName");

-- CreateIndex
CREATE INDEX "PlannedMaintenance_organizationId_scheduledDate_idx" ON "PlannedMaintenance"("organizationId", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedMaintenance_organizationId_maintenanceCode_key" ON "PlannedMaintenance"("organizationId", "maintenanceCode");

-- CreateIndex
CREATE UNIQUE INDEX "RiskFactorDefinition_organizationId_category_factorName_key" ON "RiskFactorDefinition"("organizationId", "category", "factorName");

-- CreateIndex
CREATE INDEX "ReleaseRiskMetric_releaseId_idx" ON "ReleaseRiskMetric"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskScoreThreshold_organizationId_riskLevel_key" ON "RiskScoreThreshold"("organizationId", "riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "RiskLikelihoodScale_organizationId_score_key" ON "RiskLikelihoodScale"("organizationId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "RiskImpactScale_organizationId_score_key" ON "RiskImpactScale"("organizationId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "SLAMetricDefinition_organizationId_metricName_key" ON "SLAMetricDefinition"("organizationId", "metricName");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStageDefinition_organizationId_entityType_stageCode_key" ON "WorkflowStageDefinition"("organizationId", "entityType", "stageCode");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalTypeDefinition_organizationId_code_key" ON "ApprovalTypeDefinition"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "RoleDefinition_organizationId_code_key" ON "RoleDefinition"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "TestingPhaseGate_organizationId_phaseName_key" ON "TestingPhaseGate"("organizationId", "phaseName");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTypeDefinition_organizationId_triggerEvent_key" ON "NotificationTypeDefinition"("organizationId", "triggerEvent");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseSizeDefinition_organizationId_size_key" ON "ReleaseSizeDefinition"("organizationId", "size");

-- CreateIndex
CREATE UNIQUE INDEX "EnvironmentTypeDefinition_organizationId_envCode_key" ON "EnvironmentTypeDefinition"("organizationId", "envCode");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentWindowDefinition_organizationId_windowName_key" ON "DeploymentWindowDefinition"("organizationId", "windowName");

-- CreateIndex
CREATE UNIQUE INDEX "SharedEnvironmentConfig_organizationId_environmentName_key" ON "SharedEnvironmentConfig"("organizationId", "environmentName");

-- CreateIndex
CREATE UNIQUE INDEX "SharedEnvironmentDepartment_sharedEnvironmentId_departmentI_key" ON "SharedEnvironmentDepartment"("sharedEnvironmentId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCategoryDefinition_organizationId_category_key" ON "ApplicationCategoryDefinition"("organizationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_organizationId_entityType_fieldName_key" ON "CustomFieldDefinition"("organizationId", "entityType", "fieldName");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperAdminProfile" ADD CONSTRAINT "SuperAdminProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperAdminProfile" ADD CONSTRAINT "SuperAdminProfile_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_releaseOwnerId_fkey" FOREIGN KEY ("releaseOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseApplication" ADD CONSTRAINT "ReleaseApplication_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseApplication" ADD CONSTRAINT "ReleaseApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseDependency" ADD CONSTRAINT "ReleaseDependency_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseDependency" ADD CONSTRAINT "ReleaseDependency_dependsOnReleaseId_fkey" FOREIGN KEY ("dependsOnReleaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseAuditEvent" ADD CONSTRAINT "ReleaseAuditEvent_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvBooking" ADD CONSTRAINT "EnvBooking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvBooking" ADD CONSTRAINT "EnvBooking_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvBooking" ADD CONSTRAINT "EnvBooking_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvBooking" ADD CONSTRAINT "EnvBooking_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemMappingEdge" ADD CONSTRAINT "SystemMappingEdge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SystemMappingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemMappingEdge" ADD CONSTRAINT "SystemMappingEdge_sourceAppId_fkey" FOREIGN KEY ("sourceAppId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemMappingEdge" ADD CONSTRAINT "SystemMappingEdge_sourceEnvId_fkey" FOREIGN KEY ("sourceEnvId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemMappingEdge" ADD CONSTRAINT "SystemMappingEdge_targetAppId_fkey" FOREIGN KEY ("targetAppId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemMappingEdge" ADD CONSTRAINT "SystemMappingEdge_targetEnvId_fkey" FOREIGN KEY ("targetEnvId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemIntegration" ADD CONSTRAINT "SystemIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemIntegration" ADD CONSTRAINT "SystemIntegration_sourceAppId_fkey" FOREIGN KEY ("sourceAppId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connector" ADD CONSTRAINT "Connector_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorSyncLog" ADD CONSTRAINT "ConnectorSyncLog_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "P1Issue" ADD CONSTRAINT "P1Issue_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseStakeholder" ADD CONSTRAINT "ReleaseStakeholder_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseStakeholder" ADD CONSTRAINT "ReleaseStakeholder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_riskOwnerId_fkey" FOREIGN KEY ("riskOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drift" ADD CONSTRAINT "Drift_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drift" ADD CONSTRAINT "Drift_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drift" ADD CONSTRAINT "Drift_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecordRelease" ADD CONSTRAINT "LeaveRecordRelease_leaveRecordId_fkey" FOREIGN KEY ("leaveRecordId") REFERENCES "LeaveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecordRelease" ADD CONSTRAINT "LeaveRecordRelease_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentVersion" ADD CONSTRAINT "EnvironmentVersion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentVersion" ADD CONSTRAINT "EnvironmentVersion_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringAlert" ADD CONSTRAINT "MonitoringAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringAlert" ADD CONSTRAINT "MonitoringAlert_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_relatedReleaseId_fkey" FOREIGN KEY ("relatedReleaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusCheck" ADD CONSTRAINT "ApplicationStatusCheck_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusCheck" ADD CONSTRAINT "ApplicationStatusCheck_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedMaintenance" ADD CONSTRAINT "PlannedMaintenance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskFactorDefinition" ADD CONSTRAINT "RiskFactorDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseRiskMetric" ADD CONSTRAINT "ReleaseRiskMetric_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScoreThreshold" ADD CONSTRAINT "RiskScoreThreshold_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskLikelihoodScale" ADD CONSTRAINT "RiskLikelihoodScale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskImpactScale" ADD CONSTRAINT "RiskImpactScale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SLAMetricDefinition" ADD CONSTRAINT "SLAMetricDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStageDefinition" ADD CONSTRAINT "WorkflowStageDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTypeDefinition" ADD CONSTRAINT "ApprovalTypeDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleDefinition" ADD CONSTRAINT "RoleDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestingPhaseGate" ADD CONSTRAINT "TestingPhaseGate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTypeDefinition" ADD CONSTRAINT "NotificationTypeDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseSizeDefinition" ADD CONSTRAINT "ReleaseSizeDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeFreezePeriod" ADD CONSTRAINT "ChangeFreezePeriod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentTypeDefinition" ADD CONSTRAINT "EnvironmentTypeDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentWindowDefinition" ADD CONSTRAINT "DeploymentWindowDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedEnvironmentConfig" ADD CONSTRAINT "SharedEnvironmentConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedEnvironmentDepartment" ADD CONSTRAINT "SharedEnvironmentDepartment_sharedEnvironmentId_fkey" FOREIGN KEY ("sharedEnvironmentId") REFERENCES "SharedEnvironmentConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedEnvironmentDepartment" ADD CONSTRAINT "SharedEnvironmentDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCategoryDefinition" ADD CONSTRAINT "ApplicationCategoryDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

