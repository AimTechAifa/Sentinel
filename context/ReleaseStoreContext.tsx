"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDecision,
  getDeployment,
  getMergedHistory,
  initiateRollback,
  loadReleaseStore,
  markAllNotificationsRead,
  markNotificationRead,
  recordDecision,
  recordReminderSent,
  setRollbackNarrative,
  saveReleaseStore,
  startDeployment,
  tickDeploymentLive,
  unreadCount,
  type ReleaseStoreState,
} from "@/lib/release-store";
import type { DeploymentLiveState, HistoryEntry, Release, ReleaseDecision } from "@/lib/types";

interface ReleaseStoreContextValue {
  state: ReleaseStoreState;
  getReleaseDecision: (releaseId: string) => ReturnType<typeof getDecision>;
  getReleaseHistory: (releaseId: string, base: HistoryEntry[]) => HistoryEntry[];
  getDeploymentState: (release: Release) => DeploymentLiveState;
  setReleaseDecision: (
    releaseId: string,
    version: string,
    decision: ReleaseDecision,
    opts?: { rationale?: string; overridden?: boolean }
  ) => void;
  sendApprovalReminder: (releaseId: string, version: string, gate: string, channel: string) => void;
  startDeploy: (release: Release) => void;
  tickDeploy: (release: Release) => void;
  rollbackDeploy: (release: Release) => void;
  setRollbackNarrative: (releaseId: string, narrative: string) => void;
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;
  unreadNotifications: number;
}

const ReleaseStoreContext = createContext<ReleaseStoreContextValue | null>(null);

export function ReleaseStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReleaseStoreState>(() => loadReleaseStore());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadReleaseStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveReleaseStore(state);
  }, [state, hydrated]);

  const persist = useCallback((updater: (prev: ReleaseStoreState) => ReleaseStoreState) => {
    setState((prev) => updater(prev));
  }, []);

  const value = useMemo<ReleaseStoreContextValue>(
    () => ({
      state,
      getReleaseDecision: (releaseId) => getDecision(state, releaseId),
      getReleaseHistory: (releaseId, base) => getMergedHistory(state, releaseId, base),
      getDeploymentState: (release) => getDeployment(state, release.id, release),
      setReleaseDecision: (releaseId, version, decision, opts) => {
        persist((prev) => recordDecision(prev, releaseId, version, decision, opts ?? {}));
      },
      sendApprovalReminder: (releaseId, version, gate, channel) => {
        persist((prev) => recordReminderSent(prev, releaseId, version, gate, channel));
      },
      startDeploy: (release) => {
        persist((prev) => startDeployment(prev, release.id, release, release.version));
      },
      tickDeploy: (release) => {
        persist((prev) => tickDeploymentLive(prev, release.id, release));
      },
      rollbackDeploy: (release) => {
        persist((prev) => initiateRollback(prev, release.id, release, release.version));
      },
      setRollbackNarrative: (releaseId, narrative) => {
        persist((prev) => setRollbackNarrative(prev, releaseId, narrative));
      },
      dismissNotification: (id) => persist((prev) => markNotificationRead(prev, id)),
      dismissAllNotifications: () => persist((prev) => markAllNotificationsRead(prev)),
      unreadNotifications: unreadCount(state),
    }),
    [state, persist]
  );

  return <ReleaseStoreContext.Provider value={value}>{children}</ReleaseStoreContext.Provider>;
}

export function useReleaseStore() {
  const ctx = useContext(ReleaseStoreContext);
  if (!ctx) throw new Error("useReleaseStore must be used within ReleaseStoreProvider");
  return ctx;
}
