import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request tenant context consumed by the Prisma middleware in lib/prisma.ts.
 *
 * Resolution order inside the middleware:
 *   1. Explicit AsyncLocalStorage context (runWithOrgContext / runWithSystemTemplateContext)
 *   2. The authenticated request's session cookie (via next/headers)
 *   3. No context -> queries pass through unscoped (seed scripts, CLI tools)
 */
export interface OrgContext {
  organizationId: string;
  /**
   * Escape hatch for the "Load Recommended Defaults" onboarding flow only:
   * allows reads against the sentinel global org's isSystemDefault rows.
   * Never set this from a route handler directly.
   */
  context?: "system-template";
  /** Admin trash/recover views: skip the automatic deletedAt: null filter. */
  includeDeleted?: boolean;
  /** Explicit admin "permanently delete" action: allow real row deletion. */
  hardDelete?: boolean;
}

export const orgContextStorage = new AsyncLocalStorage<OrgContext>();

export function getOrgContext(): OrgContext | undefined {
  return orgContextStorage.getStore();
}

/**
 * Resolves the tenant context for the current Prisma call:
 * explicit AsyncLocalStorage scope first, then the request's session cookie.
 * Returns undefined outside a request (seed scripts, CLI) so those run unscoped.
 */
export async function resolveOrgContext(): Promise<OrgContext | undefined> {
  const explicit = orgContextStorage.getStore();
  if (explicit) return explicit;
  try {
    // Dynamic import so non-Next processes (tsx seed scripts) never load next/headers.
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const raw = jar.get("sentinel-session")?.value;
    if (!raw) return undefined;
    const session = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      organizationId?: string;
    };
    return session.organizationId ? { organizationId: session.organizationId } : undefined;
  } catch {
    return undefined; // not inside a Next request scope
  }
}

/**
 * Prisma queries are lazy (they execute on await, not on delegate call), so the
 * callback must be awaited INSIDE the AsyncLocalStorage scope — otherwise the
 * query middleware runs after the scope exits and sees no context.
 */
export function runWithOrgContext<T>(ctx: OrgContext, fn: () => Promise<T> | T): Promise<T> {
  return orgContextStorage.run(ctx, async () => await fn());
}

/**
 * Escape hatch used ONLY by system-defaults services (cloneSystemDefaultsToOrg):
 * scopes queries to the sentinel global org that owns isSystemDefault template rows.
 */
export function runWithSystemTemplateContext<T>(
  sentinelOrgId: string,
  fn: () => Promise<T> | T
): Promise<T> {
  return orgContextStorage.run(
    { organizationId: sentinelOrgId, context: "system-template" },
    async () => await fn()
  );
}

/** Models carrying organizationId directly — the middleware injects the tenant filter. */
export const ORG_SCOPED_MODELS = new Set<string>([
  "Department",
  "Application",
  "User",
  "SuperAdminProfile",
  "Release",
  "EnvBooking",
  "Connector",
  "SystemIntegration",
  "Risk",
  "Drift",
  "Approval",
  "LeaveRecord",
  "CalendarEvent",
  "MonitoringAlert",
  "Incident",
  "ApplicationStatusCheck",
  "PlannedMaintenance",
  "RiskFactorDefinition",
  "RiskScoreThreshold",
  "RiskLikelihoodScale",
  "RiskImpactScale",
  "SLAMetricDefinition",
  "WorkflowStageDefinition",
  "ApprovalTypeDefinition",
  "RoleDefinition",
  "TestingPhaseGate",
  "NotificationTypeDefinition",
  "ReleaseSizeDefinition",
  "ChangeFreezePeriod",
  "EnvironmentTypeDefinition",
  "DeploymentWindowDefinition",
  "SharedEnvironmentConfig",
  "ApplicationCategoryDefinition",
  "CustomFieldDefinition",
  "SystemMappingGroup",
  "SystemMappingEdge",
  "P1Issue",
  "WorkItem",
  "ReleaseDecisionState",
  "DeploymentState",
  "ReleaseHistoryEvent",
  "AppNotificationRow",
  "AgentPauseState",
]);

/**
 * Models with no organizationId column of their own — scoped through a
 * parent relation instead ({ <relationField>: { organizationId } }).
 * `parentFkField`/`parentDelegate` tell the middleware which FK to verify
 * against the caller's org before allowing a `create` (Prisma doesn't let a
 * `where` filter constrain `create`/the create-branch of `upsert`, so that
 * path needs an explicit pre-check — see lib/prisma.ts).
 */
export const RELATION_SCOPED_MODELS: Record<
  string,
  { filter: (organizationId: string) => object; parentFkField: string; parentDelegate: string }
> = {
  Environment: {
    filter: (organizationId) => ({ application: { organizationId } }),
    parentFkField: "applicationId",
    parentDelegate: "Application",
  },
  EnvironmentVersion: {
    filter: (organizationId) => ({ application: { organizationId } }),
    parentFkField: "applicationId",
    parentDelegate: "Application",
  },
  ReleaseAuditEvent: {
    filter: (organizationId) => ({ release: { organizationId } }),
    parentFkField: "releaseId",
    parentDelegate: "Release",
  },
  ConnectorSyncLog: {
    filter: (organizationId) => ({ connector: { organizationId } }),
    parentFkField: "connectorId",
    parentDelegate: "Connector",
  },
};

/** Soft-deleted models: delete becomes update({ deletedAt }), reads filter deletedAt: null. */
export const SOFT_DELETE_MODELS = new Set<string>(["Release", "Application", "Environment"]);
