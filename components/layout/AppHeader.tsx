"use client";

import { useEffect, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { Bell, CircleHelp, Menu, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { HelpCenterModal } from "@/components/help/HelpCenterModal";
import { ThemeModeToggle } from "@/components/materio/ThemeModeToggle";
import { useReleaseStore } from "@/context/ReleaseStoreContext";

export function AppHeader() {
  const { toggleMobileSidebar } = useSidebar();
  const { unreadNotifications } = useReleaseStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="materio-header sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--header)]">
        <div className="flex h-[var(--header-height)] items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-600 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="relative hidden max-w-md flex-1 items-center text-left lg:flex"
            >
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <span className="flex h-10 w-full items-center rounded-lg border border-[var(--border)] bg-white pl-10 pr-16 text-sm text-gray-500 shadow-theme-sm">
                Search releases, tickets, CRs...
              </span>
              <kbd className="absolute right-3 hidden rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-xs text-gray-400 sm:inline">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-gray-500 transition-colors hover:bg-gray-50 lg:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <ThemeModeToggle />

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-gray-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
              aria-label="Help and navigation"
              title="Help & navigation"
            >
              <CircleHelp className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-gray-500 transition-colors hover:bg-gray-50"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-medium text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>
              <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
            </div>

            <div className="ml-1 flex items-center gap-2 border-l border-[var(--border)] pl-3">
              <Avatar name="Priya Sharma" size="sm" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">Priya Sharma</p>
                <p className="text-xs text-gray-500">Release Manager</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <HelpCenterModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
