/**
 * The new schema removed the flat Release.owner string — ownership is the
 * releaseOwner User relation (releaseOwnerId). These helpers derive a display
 * name so existing UI/serialization keeps a stable `owner` field.
 */
export const RELEASE_OWNER_INCLUDE = { releaseOwner: { select: { name: true } } } as const;

export type WithReleaseOwner = { releaseOwner?: { name: string } | null };

export function releaseOwnerName(r: WithReleaseOwner): string {
  return r.releaseOwner?.name ?? "Unassigned";
}

/** Adds a derived `owner` string to a release row fetched with RELEASE_OWNER_INCLUDE. */
export function withOwner<T extends WithReleaseOwner>(r: T): T & { owner: string } {
  return { ...r, owner: releaseOwnerName(r) };
}
