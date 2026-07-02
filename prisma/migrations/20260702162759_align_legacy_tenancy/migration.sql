-- Adds organizationId to previously-unscoped legacy tables so they are
-- covered by the same multi-tenant isolation as every other model.
-- Non-destructive: columns are added nullable first, backfilled onto the
-- existing demo org (the only org with data in these tables today), then
-- made NOT NULL — no rows are dropped or recreated.

-- ── AgentPauseState: composite PK swap (organizationId, agentId) ──────────
ALTER TABLE "AgentPauseState" ADD COLUMN     "organizationId" TEXT;
UPDATE "AgentPauseState" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "AgentPauseState" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "AgentPauseState" DROP CONSTRAINT "AgentPauseState_pkey",
ADD CONSTRAINT "AgentPauseState_pkey" PRIMARY KEY ("organizationId", "agentId");

-- ── AppNotificationRow ──────────────────────────────────────────────────
ALTER TABLE "AppNotificationRow" ADD COLUMN     "organizationId" TEXT;
UPDATE "AppNotificationRow" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "AppNotificationRow" ALTER COLUMN "organizationId" SET NOT NULL;

-- ── DeploymentState ─────────────────────────────────────────────────────
DROP INDEX "DeploymentState_releaseId_key";
ALTER TABLE "DeploymentState" ADD COLUMN     "organizationId" TEXT;
UPDATE "DeploymentState" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "DeploymentState" ALTER COLUMN "organizationId" SET NOT NULL;

-- ── P1Issue ─────────────────────────────────────────────────────────────
DROP INDEX "P1Issue_externalId_key";
DROP INDEX "P1Issue_status_idx";
ALTER TABLE "P1Issue" ADD COLUMN     "organizationId" TEXT;
UPDATE "P1Issue" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "P1Issue" ALTER COLUMN "organizationId" SET NOT NULL;

-- ── ReleaseDecisionState ────────────────────────────────────────────────
DROP INDEX "ReleaseDecisionState_releaseId_key";
ALTER TABLE "ReleaseDecisionState" ADD COLUMN     "organizationId" TEXT;
UPDATE "ReleaseDecisionState" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "ReleaseDecisionState" ALTER COLUMN "organizationId" SET NOT NULL;

-- ── ReleaseHistoryEvent ─────────────────────────────────────────────────
DROP INDEX "ReleaseHistoryEvent_releaseId_idx";
DROP INDEX "ReleaseHistoryEvent_releaseId_timestamp_idx";
ALTER TABLE "ReleaseHistoryEvent" ADD COLUMN     "organizationId" TEXT;
UPDATE "ReleaseHistoryEvent" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "ReleaseHistoryEvent" ALTER COLUMN "organizationId" SET NOT NULL;

-- ── SystemMappingEdge / SystemMappingGroup ─────────────────────────────
ALTER TABLE "SystemMappingEdge" ADD COLUMN     "organizationId" TEXT;
UPDATE "SystemMappingEdge" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "SystemMappingEdge" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "SystemMappingGroup" ADD COLUMN     "organizationId" TEXT;
UPDATE "SystemMappingGroup" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "SystemMappingGroup" ALTER COLUMN "organizationId" SET NOT NULL;

-- ── WorkItem ────────────────────────────────────────────────────────────
DROP INDEX "WorkItem_externalId_key";
DROP INDEX "WorkItem_releaseCode_idx";
DROP INDEX "WorkItem_status_idx";
ALTER TABLE "WorkItem" ADD COLUMN     "organizationId" TEXT;
UPDATE "WorkItem" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp-demo') WHERE "organizationId" IS NULL;
ALTER TABLE "WorkItem" ALTER COLUMN "organizationId" SET NOT NULL;

-- ── New indexes matching the updated compound unique keys ──────────────
CREATE INDEX "AppNotificationRow_organizationId_timestamp_idx" ON "AppNotificationRow"("organizationId", "timestamp");
CREATE UNIQUE INDEX "DeploymentState_organizationId_releaseId_key" ON "DeploymentState"("organizationId", "releaseId");
CREATE INDEX "P1Issue_organizationId_status_idx" ON "P1Issue"("organizationId", "status");
CREATE UNIQUE INDEX "P1Issue_organizationId_externalId_key" ON "P1Issue"("organizationId", "externalId");
CREATE UNIQUE INDEX "ReleaseDecisionState_organizationId_releaseId_key" ON "ReleaseDecisionState"("organizationId", "releaseId");
CREATE INDEX "ReleaseHistoryEvent_organizationId_releaseId_idx" ON "ReleaseHistoryEvent"("organizationId", "releaseId");
CREATE INDEX "ReleaseHistoryEvent_organizationId_releaseId_timestamp_idx" ON "ReleaseHistoryEvent"("organizationId", "releaseId", "timestamp");
CREATE INDEX "SystemMappingEdge_organizationId_idx" ON "SystemMappingEdge"("organizationId");
CREATE INDEX "SystemMappingGroup_organizationId_idx" ON "SystemMappingGroup"("organizationId");
CREATE INDEX "WorkItem_organizationId_releaseCode_idx" ON "WorkItem"("organizationId", "releaseCode");
CREATE INDEX "WorkItem_organizationId_status_idx" ON "WorkItem"("organizationId", "status");
CREATE UNIQUE INDEX "WorkItem_organizationId_externalId_key" ON "WorkItem"("organizationId", "externalId");

-- ── Foreign keys to Organization ────────────────────────────────────────
ALTER TABLE "SystemMappingGroup" ADD CONSTRAINT "SystemMappingGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SystemMappingEdge" ADD CONSTRAINT "SystemMappingEdge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "P1Issue" ADD CONSTRAINT "P1Issue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseDecisionState" ADD CONSTRAINT "ReleaseDecisionState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeploymentState" ADD CONSTRAINT "DeploymentState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseHistoryEvent" ADD CONSTRAINT "ReleaseHistoryEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppNotificationRow" ADD CONSTRAINT "AppNotificationRow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentPauseState" ADD CONSTRAINT "AgentPauseState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
