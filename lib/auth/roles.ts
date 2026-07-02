export type UserRole = "readonly" | "editor" | "admin";

export interface SessionUser {
  email: string;
  name: string;
  role: UserRole;
  /** Sentinel Organization.id — every authenticated request is scoped to this tenant. */
  organizationId: string;
  /** Clerk Organizations ID this session was resolved from, when Clerk is active. */
  clerkOrgId?: string;
  /** Sentinel User.id when the session email matches a seeded/managed user row. */
  userId?: string;
}

export const SESSION_COOKIE = "sentinel-session";

export const ROLE_LABELS: Record<UserRole, string> = {
  readonly: "Read only",
  editor: "Editor",
  admin: "Admin",
};

export function canEdit(user: SessionUser | null): boolean {
  return user?.role === "editor" || user?.role === "admin";
}

export function canAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin";
}
