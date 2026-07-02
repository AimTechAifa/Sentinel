import { PrismaClient, Prisma } from "@prisma/client";
import {
  resolveOrgContext,
  ORG_SCOPED_MODELS,
  RELATION_SCOPED_MODELS,
  SOFT_DELETE_MODELS,
} from "./tenancy";

const READ_ACTIONS = new Set(["findMany", "findFirst", "count", "aggregate", "groupBy"]);
const WHERE_INJECTABLE = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);
// Unique-key operations can't take a non-unique organizationId filter directly;
// ownership is verified with a scoped findFirst before the operation runs.
const UNIQUE_OPS = new Set(["update", "delete", "findUnique", "findUniqueOrThrow", "upsert"]);

/**
 * findFirst can't take compound-unique-key syntax ({ organizationId_code: {...} }),
 * so expand those composite objects into their scalar equality parts for the
 * ownership pre-checks.
 */
function flattenUniqueWhere(where: object | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(where ?? {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) && k.includes("_")) {
      Object.assign(out, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function delegateFor(client: PrismaClient, model: string) {
  return (client as unknown as Record<
    string,
    {
      findFirst: (a: object) => Promise<{ id: string } | null>;
      count: (a: object) => Promise<number>;
      update: (a: object) => Promise<unknown>;
      updateMany: (a: object) => Promise<unknown>;
    }
  >)[model.charAt(0).toLowerCase() + model.slice(1)];
}

/**
 * B1 gap fix: `where` clauses can't constrain `create` (or the create-branch
 * of `upsert`), so relation-scoped models need an explicit pre-check that the
 * parent row referenced by the FK in the payload actually belongs to the
 * caller's org — otherwise a client could pass a foreign org's parent id
 * (e.g. applicationId) straight through untouched.
 */
async function assertRelationOwnership(
  base: PrismaClient,
  model: string,
  parentDelegate: string,
  parentFkField: string,
  organizationId: string,
  data: unknown
): Promise<void> {
  const rows = Array.isArray(data) ? data : [data];
  const fkValues = Array.from(
    new Set(
      rows
        .map((r) => (r as Record<string, unknown> | undefined)?.[parentFkField])
        .filter((v): v is string => typeof v === "string")
    )
  );
  if (fkValues.length === 0) return;
  const ownedCount = await delegateFor(base, parentDelegate).count({
    where: { id: { in: fkValues }, organizationId },
  });
  if (ownedCount !== fkValues.length) {
    throw new Prisma.PrismaClientKnownRequestError(
      `${model} references a ${parentDelegate} outside this organization`,
      { code: "P2025", clientVersion: Prisma.prismaVersion.client }
    );
  }
}

function createClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  /**
   * B1 + B2 — centralized tenancy and soft-delete enforcement.
   * Prisma 6 removed $use middleware; this is the equivalent query extension.
   * Applies to every model operation, so no route handler has to remember
   * to add organizationId or deletedAt filters manually.
   */
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const ctx = await resolveOrgContext();
          const isSoftDelete = SOFT_DELETE_MODELS.has(model);
          let op = operation as string;
          let a = (args ?? {}) as Record<string, unknown>;

          // ── B2: soft delete — reads hide deleted rows unless asked ──────
          if (isSoftDelete && READ_ACTIONS.has(op)) {
            const argsIncludeDeleted = (a as { includeDeleted?: boolean }).includeDeleted;
            if (argsIncludeDeleted !== undefined) {
              delete (a as { includeDeleted?: boolean }).includeDeleted;
            }
            const includeDeleted = argsIncludeDeleted ?? ctx?.includeDeleted ?? false;
            if (!includeDeleted) {
              a.where = { AND: [{ deletedAt: null }, (a.where as object) ?? {}] };
            }
          }

          // ── B1: organization scoping ────────────────────────────────────
          // No context (seed scripts, CLI tooling) -> pass through unscoped.
          // Every authenticated API request resolves a context via the
          // session cookie, so app traffic is always tenant-scoped.
          if (ctx) {
            const relationSpec = RELATION_SCOPED_MODELS[model];
            const orgWhere: object | undefined = ORG_SCOPED_MODELS.has(model)
              ? ctx.context === "system-template"
                ? // Escape hatch for onboarding: read the sentinel org's
                  // isSystemDefault template rows. Reads only.
                  {
                    organizationId: ctx.organizationId,
                    ...(READ_ACTIONS.has(op) ? { isSystemDefault: true } : {}),
                  }
                : { organizationId: ctx.organizationId }
              : relationSpec?.filter(ctx.organizationId);

            // Relation-scoped models: verify the FK in the payload belongs to
            // the caller's org before create/createMany/upsert-create runs.
            if (relationSpec) {
              if (op === "create") {
                await assertRelationOwnership(
                  base,
                  model,
                  relationSpec.parentDelegate,
                  relationSpec.parentFkField,
                  ctx.organizationId,
                  a.data
                );
              } else if (op === "createMany") {
                await assertRelationOwnership(
                  base,
                  model,
                  relationSpec.parentDelegate,
                  relationSpec.parentFkField,
                  ctx.organizationId,
                  a.data
                );
              }
            }

            if (orgWhere) {
              if (WHERE_INJECTABLE.has(op)) {
                a.where = { AND: [orgWhere, (a.where as object) ?? {}] };
              } else if (UNIQUE_OPS.has(op)) {
                // Verify the target row belongs to the caller's org before the
                // unique-key operation runs (blocks cross-tenant access by id).
                const existing = await delegateFor(base, model).findFirst({
                  where: { AND: [orgWhere, flattenUniqueWhere(a.where as object)] },
                  select: { id: true },
                });
                if (!existing) {
                  if (op === "findUnique") return null;
                  if (op === "upsert") {
                    // No row in this org. If the unique key matches a row in
                    // ANOTHER org, Prisma would update it — block that.
                    const foreign = await delegateFor(base, model).findFirst({
                      where: flattenUniqueWhere(a.where as object),
                      select: { id: true },
                    });
                    if (foreign) {
                      throw new Prisma.PrismaClientKnownRequestError(
                        `${model} upsert key belongs to another organization`,
                        { code: "P2025", clientVersion: Prisma.prismaVersion.client }
                      );
                    }
                    // Otherwise fall through — the create side runs with the
                    // caller's organizationId injected below (ORG_SCOPED_MODELS)
                    // or verified here (relation-scoped models, e.g. Environment).
                    if (relationSpec) {
                      await assertRelationOwnership(
                        base,
                        model,
                        relationSpec.parentDelegate,
                        relationSpec.parentFkField,
                        ctx.organizationId,
                        a.create
                      );
                    }
                  } else {
                    throw new Prisma.PrismaClientKnownRequestError(
                      `${model} record not found in this organization`,
                      { code: "P2025", clientVersion: Prisma.prismaVersion.client }
                    );
                  }
                }
              }

              if (ORG_SCOPED_MODELS.has(model)) {
                // Inject the tenant key on writes so a route can never write
                // into another org, even if it passes an organizationId.
                if (op === "create") {
                  a.data = { ...((a.data as object) ?? {}), organizationId: ctx.organizationId };
                } else if (op === "createMany") {
                  const rows = Array.isArray(a.data) ? a.data : [a.data];
                  a.data = rows.map((r: object) => ({ ...r, organizationId: ctx.organizationId }));
                } else if (op === "upsert") {
                  a.create = { ...((a.create as object) ?? {}), organizationId: ctx.organizationId };
                }
              }
            }
          }

          // ── B2: soft delete — deletes become deletedAt updates ──────────
          if (isSoftDelete && !ctx?.hardDelete) {
            if (op === "delete") {
              return delegateFor(base, model).update({
                where: a.where,
                data: { deletedAt: new Date() },
              });
            }
            if (op === "deleteMany") {
              return delegateFor(base, model).updateMany({
                where: a.where,
                data: { deletedAt: new Date() },
              });
            }
          }

          return query(a as never);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
