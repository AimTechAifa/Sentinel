import { NextResponse } from "next/server";
import { getSession } from "./session";
import type { SessionUser, UserRole } from "./roles";
import { prisma } from "../prisma";

export interface RequestContext {
  organizationId: string;
  userId: string | null;
  role: UserRole;
  email: string;
  name: string;
}

/**
 * B3 — the single entry point every API route calls first.
 * Resolves the authenticated session (Clerk-org-aware via the login flow)
 * into { organizationId, userId, role }. Requests with no resolvable
 * organizationId never get here — middleware.ts rejects them with 401.
 */
export async function getRequestContext(): Promise<
  | { ctx: RequestContext; error: null }
  | { ctx: null; error: NextResponse }
> {
  const session = await getSession();
  if (!session?.organizationId) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: "Unauthorized: no organization resolved for this session" },
        { status: 401 }
      ),
    };
  }
  return {
    ctx: {
      organizationId: session.organizationId,
      userId: session.userId ?? null,
      role: session.role,
      email: session.email,
      name: session.name,
    },
    error: null,
  };
}

/**
 * Resolves a Clerk organization ID to the Sentinel Organization.id.
 * Called at sign-in: if the Clerk org has not been linked yet, links it to an
 * existing org by slug match or creates a fresh Organization for it.
 */
export async function resolveClerkOrganization(
  clerkOrgId: string,
  orgName?: string,
  orgSlug?: string
): Promise<string> {
  const existing = await prisma.organization.findUnique({ where: { clerkOrgId } });
  if (existing) return existing.id;

  if (orgSlug) {
    const bySlug = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (bySlug && !bySlug.isSystemGlobal) {
      const linked = await prisma.organization.update({
        where: { id: bySlug.id },
        data: { clerkOrgId },
      });
      return linked.id;
    }
  }

  const created = await prisma.organization.create({
    data: {
      name: orgName ?? "New Organization",
      slug: orgSlug ?? `org-${clerkOrgId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      clerkOrgId,
    },
  });
  return created.id;
}

/** Session shape helper reused by the login route. */
export async function buildSessionForOrg(
  email: string,
  name: string,
  role: UserRole,
  organizationId: string,
  clerkOrgId?: string
): Promise<SessionUser> {
  const dbUser = await prisma.user.findFirst({
    where: { organizationId, email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  return {
    email,
    name,
    role,
    organizationId,
    clerkOrgId,
    userId: dbUser?.id,
  };
}
