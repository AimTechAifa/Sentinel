import { prisma } from "./prisma";
import { runWithOrgContext, runWithSystemTemplateContext } from "./tenancy";

export const SENTINEL_ORG_SLUG = "system-global";

/**
 * The 16 engine/config tables that carry isSystemDefault template rows in the
 * sentinel global org. Keys are the entityType names accepted by
 * cloneSystemDefaultsToOrg; values are the Prisma delegate names plus the
 * natural unique key used for idempotency.
 */
const CLONEABLE_ENTITIES: Record<
  string,
  { delegate: string; naturalKey: string[] }
> = {
  RiskFactorDefinition: { delegate: "riskFactorDefinition", naturalKey: ["category", "factorName"] },
  RiskScoreThreshold: { delegate: "riskScoreThreshold", naturalKey: ["riskLevel"] },
  RiskLikelihoodScale: { delegate: "riskLikelihoodScale", naturalKey: ["score"] },
  RiskImpactScale: { delegate: "riskImpactScale", naturalKey: ["score"] },
  SLAMetricDefinition: { delegate: "sLAMetricDefinition", naturalKey: ["metricName"] },
  WorkflowStageDefinition: { delegate: "workflowStageDefinition", naturalKey: ["entityType", "stageCode"] },
  ApprovalTypeDefinition: { delegate: "approvalTypeDefinition", naturalKey: ["code"] },
  RoleDefinition: { delegate: "roleDefinition", naturalKey: ["code"] },
  TestingPhaseGate: { delegate: "testingPhaseGate", naturalKey: ["phaseName"] },
  NotificationTypeDefinition: { delegate: "notificationTypeDefinition", naturalKey: ["triggerEvent"] },
  ReleaseSizeDefinition: { delegate: "releaseSizeDefinition", naturalKey: ["size"] },
  ChangeFreezePeriod: { delegate: "changeFreezePeriod", naturalKey: ["periodName"] },
  EnvironmentTypeDefinition: { delegate: "environmentTypeDefinition", naturalKey: ["envCode"] },
  DeploymentWindowDefinition: { delegate: "deploymentWindowDefinition", naturalKey: ["windowName"] },
  SharedEnvironmentConfig: { delegate: "sharedEnvironmentConfig", naturalKey: ["environmentName"] },
  ApplicationCategoryDefinition: { delegate: "applicationCategoryDefinition", naturalKey: ["category"] },
};

export async function getSentinelOrgId(): Promise<string> {
  // Organization itself is not an org-scoped model, so this lookup is safe
  // regardless of the caller's request context.
  const sentinel = await prisma.organization.findFirst({
    where: { isSystemGlobal: true },
  });
  if (!sentinel) {
    throw new Error(
      `Sentinel global organization not found (expected slug "${SENTINEL_ORG_SLUG}"). Run the seed script first.`
    );
  }
  return sentinel.id;
}

export interface CloneResult {
  entityType: string;
  cloned: number;
  skippedExisting: number;
}

/**
 * B5 — copies all isSystemDefault = true template rows from the sentinel
 * global org into the target org. This is the backend behind the onboarding
 * wizard's "Load Recommended Defaults" button.
 *
 * Idempotent: rows whose natural unique key already exists in the target org
 * are skipped, so calling twice never creates duplicates.
 *
 * NOTE: intentionally uses the sentinel org's id directly (the
 * 'system-template' escape hatch) — this is the only sanctioned path for
 * reading another org's rows.
 */
export async function cloneSystemDefaultsToOrg(
  targetOrganizationId: string,
  entityTypes?: string[]
): Promise<CloneResult[]> {
  const sentinelOrgId = await getSentinelOrgId();
  if (targetOrganizationId === sentinelOrgId) {
    throw new Error("Cannot clone system defaults into the sentinel global org itself");
  }

  const requested = entityTypes ?? Object.keys(CLONEABLE_ENTITIES);
  const results: CloneResult[] = [];

  for (const entityType of requested) {
    const spec = CLONEABLE_ENTITIES[entityType];
    if (!spec) throw new Error(`Unknown system-default entity type: ${entityType}`);

    const delegate = (prisma as unknown as Record<
      string,
      {
        findMany: (a: object) => Promise<Record<string, unknown>[]>;
        create: (a: object) => Promise<unknown>;
      }
    >)[spec.delegate];

    // system-template escape hatch: the ONLY sanctioned way to read another
    // org's rows — scopes the query to the sentinel org's isSystemDefault set.
    const templates = await runWithSystemTemplateContext(sentinelOrgId, () =>
      delegate.findMany({ where: { isSystemDefault: true } })
    );

    const existing = await runWithOrgContext({ organizationId: targetOrganizationId }, () =>
      delegate.findMany({ where: {} })
    );
    const existingKeys = new Set(
      existing.map((row) => spec.naturalKey.map((k) => String(row[k])).join("::"))
    );

    let cloned = 0;
    let skippedExisting = 0;
    for (const template of templates) {
      const key = spec.naturalKey.map((k) => String(template[k])).join("::");
      if (existingKeys.has(key)) {
        skippedExisting++;
        continue;
      }
      const { id: _id, organizationId: _org, isSystemDefault: _sys, ...fields } = template;
      await runWithOrgContext({ organizationId: targetOrganizationId }, () =>
        delegate.create({
          data: {
            ...fields,
            organizationId: targetOrganizationId,
            isSystemDefault: false,
          },
        })
      );
      cloned++;
    }
    results.push({ entityType, cloned, skippedExisting });
  }

  return results;
}
