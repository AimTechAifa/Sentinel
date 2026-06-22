import type { AppNotification, HistoryEntry, ReleaseDecision, ReleaseDecisionRecord } from "./types";

const STORAGE_KEY = "sentinel-release-state";

export interface ReleaseStoreState {
  decisions: Record<string, ReleaseDecisionRecord>;
  extraHistory: Record<string, HistoryEntry[]>;
  notifications: AppNotification[];
}

const defaultNotifications: AppNotification[] = [
  {
    id: "n1",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    title: "Security sign-off overdue",
    message: "v2.14.0 Security gate pending 72h — CAB review scheduled tomorrow",
    releaseId: "rel-v2140",
    read: false,
    type: "approval",
  },
  {
    id: "n2",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    title: "Build failed",
    message: "v2.13.5 build #4468 — 22 integration test failures",
    releaseId: "rel-v2135",
    read: false,
    type: "build",
  },
  {
    id: "n3",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    title: "CAB agenda updated",
    message: "Weekly Production CAB tomorrow — v2.14.0 and v2.14.1 on agenda",
    releaseId: "rel-v2140",
    read: false,
    type: "cab",
  },
];

function emptyStore(): ReleaseStoreState {
  return { decisions: {}, extraHistory: {}, notifications: [...defaultNotifications] };
}

export function loadReleaseStore(): ReleaseStoreState {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as ReleaseStoreState;
    return {
      decisions: parsed.decisions ?? {},
      extraHistory: parsed.extraHistory ?? {},
      notifications: parsed.notifications?.length ? parsed.notifications : [...defaultNotifications],
    };
  } catch {
    return emptyStore();
  }
}

export function saveReleaseStore(state: ReleaseStoreState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDecision(state: ReleaseStoreState, releaseId: string): ReleaseDecisionRecord | null {
  return state.decisions[releaseId] ?? null;
}

export function getMergedHistory(
  state: ReleaseStoreState,
  releaseId: string,
  baseHistory: HistoryEntry[]
): HistoryEntry[] {
  const extra = state.extraHistory[releaseId] ?? [];
  return [...baseHistory, ...extra].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function recordDecision(
  state: ReleaseStoreState,
  releaseId: string,
  version: string,
  decision: ReleaseDecision,
  opts: { rationale?: string; overridden?: boolean; actor?: string }
): ReleaseStoreState {
  const decidedAt = new Date().toISOString();
  const decidedBy = opts.actor ?? "Priya Sharma";
  const entry: ReleaseDecisionRecord = {
    decision,
    rationale: opts.rationale,
    decidedAt,
    decidedBy,
    overridden: opts.overridden,
  };

  const historyEntry: HistoryEntry = {
    id: `dec-${releaseId}-${Date.now()}`,
    timestamp: decidedAt,
    actor: decidedBy,
    action: opts.overridden
      ? `${decision} decision recorded (override): ${opts.rationale}`
      : `${decision} decision recorded for ${version}`,
    type: "human",
  };

  const notification: AppNotification = {
    id: `n-dec-${Date.now()}`,
    timestamp: decidedAt,
    title: `${decision} decision — ${version}`,
    message: opts.rationale ?? `${decidedBy} recorded a ${decision} decision`,
    releaseId,
    read: false,
    type: "decision",
  };

  return {
    ...state,
    decisions: { ...state.decisions, [releaseId]: entry },
    extraHistory: {
      ...state.extraHistory,
      [releaseId]: [...(state.extraHistory[releaseId] ?? []), historyEntry],
    },
    notifications: [notification, ...state.notifications],
  };
}

export function recordReminderSent(
  state: ReleaseStoreState,
  releaseId: string,
  version: string,
  gate: string,
  channel: string
): ReleaseStoreState {
  const timestamp = new Date().toISOString();
  const historyEntry: HistoryEntry = {
    id: `rem-${releaseId}-${Date.now()}`,
    timestamp,
    actor: "Priya Sharma",
    action: `Sent ${gate} approval reminder via ${channel} for ${version}`,
    type: "human",
  };
  const notification: AppNotification = {
    id: `n-comms-${Date.now()}`,
    timestamp,
    title: "Reminder sent",
    message: `${gate} reminder queued to ${channel} for ${version}`,
    releaseId,
    read: true,
    type: "comms",
  };

  return {
    ...state,
    extraHistory: {
      ...state.extraHistory,
      [releaseId]: [...(state.extraHistory[releaseId] ?? []), historyEntry],
    },
    notifications: [notification, ...state.notifications],
  };
}

export function markNotificationRead(state: ReleaseStoreState, id: string): ReleaseStoreState {
  return {
    ...state,
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  };
}

export function markAllNotificationsRead(state: ReleaseStoreState): ReleaseStoreState {
  return {
    ...state,
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  };
}

export function unreadCount(state: ReleaseStoreState): number {
  return state.notifications.filter((n) => !n.read).length;
}
