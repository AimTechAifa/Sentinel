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
  getMergedHistory,
  loadReleaseStore,
  markAllNotificationsRead,
  markNotificationRead,
  recordDecision,
  recordReminderSent,
  saveReleaseStore,
  unreadCount,
  type ReleaseStoreState,
} from "@/lib/release-store";
import type { HistoryEntry, ReleaseDecision } from "@/lib/types";

interface ReleaseStoreContextValue {
  state: ReleaseStoreState;
  getReleaseDecision: (releaseId: string) => ReturnType<typeof getDecision>;
  getReleaseHistory: (releaseId: string, base: HistoryEntry[]) => HistoryEntry[];
  setReleaseDecision: (
    releaseId: string,
    version: string,
    decision: ReleaseDecision,
    opts?: { rationale?: string; overridden?: boolean }
  ) => void;
  sendApprovalReminder: (releaseId: string, version: string, gate: string, channel: string) => void;
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
      setReleaseDecision: (releaseId, version, decision, opts) => {
        persist((prev) => recordDecision(prev, releaseId, version, decision, opts ?? {}));
      },
      sendApprovalReminder: (releaseId, version, gate, channel) => {
        persist((prev) => recordReminderSent(prev, releaseId, version, gate, channel));
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
