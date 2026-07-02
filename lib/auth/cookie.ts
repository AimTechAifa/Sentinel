import type { SessionUser } from "./roles";

export function parseSession(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const user = JSON.parse(json) as SessionUser;
    // organizationId is mandatory: a session without a resolvable tenant is
    // rejected at the middleware layer before any route handler runs.
    if (!user.email || !user.role || !user.organizationId) return null;
    return user;
  } catch {
    return null;
  }
}

export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}
