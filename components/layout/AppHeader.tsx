"use client";

import { useEffect, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { Bell, Menu, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { useReleaseStore } from "@/context/ReleaseStoreContext";

export function AppHeader() {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { unreadNotifications } = useReleaseStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex w-full border-b border-gray-200 bg-white">
        <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
          <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:border-b-0 lg:px-0 lg:py-4">
            <button
              type="button"
              onClick={handleToggle}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 lg:h-11 lg:w-11"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden flex-1 max-w-md lg:flex items-center relative text-left"
            >
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <span className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-400 flex items-center">
                Search releases, tickets, CRs...
              </span>
              <kbd className="absolute right-3 hidden -translate-y-0 sm:inline rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 lg:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
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
              <div className="flex items-center gap-2">
                <Avatar name="Priya Sharma" size="sm" />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">Priya Sharma</p>
                  <p className="text-xs text-gray-500">Release Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
