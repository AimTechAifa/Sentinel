import { NextResponse } from "next/server";
import { resolveSessionName } from "@/lib/user-match";
import { encodeSession } from "@/lib/auth/cookie";
import { SESSION_COOKIE, type UserRole } from "@/lib/auth/roles";
import { buildSessionForOrg, resolveClerkOrganization } from "@/lib/auth/context";
import { prisma } from "@/lib/prisma";

const DEMO_ORG_SLUG = "acme-corp-demo";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    name?: string;
    role?: UserRole;
    clerkOrgId?: string;
    orgSlug?: string;
  };
  const role = body.role ?? "readonly";
  const email = body.email ?? "user@company.com";
  const name = resolveSessionName(email, body.name);

  // Resolve the tenant: Clerk org when provided, otherwise slug, otherwise
  // the local demo org. Sessions without an organization are rejected.
  let organizationId: string | null = null;
  if (body.clerkOrgId) {
    organizationId = await resolveClerkOrganization(body.clerkOrgId, undefined, body.orgSlug);
  } else {
    const org = await prisma.organization.findUnique({
      where: { slug: body.orgSlug ?? DEMO_ORG_SLUG },
    });
    if (org && !org.isSystemGlobal) organizationId = org.id;
  }
  if (!organizationId) {
    return NextResponse.json(
      { error: "No organization could be resolved for this sign-in" },
      { status: 401 }
    );
  }

  const user = await buildSessionForOrg(email, name, role, organizationId, body.clerkOrgId);

  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
