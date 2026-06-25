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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white">
        <div className="flex h-[var(--header-height)] items-center justify-between gap-4 px-4 lg:px-8">
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
              className="relative hidden max-w-md flex-1 items-center text-left lg:flex transition-transform hover:scale-[1.01]"
            >
              <Search className="absolute left-3 h-4 w-4 text-brand-500" />
              <span className="flex h-10 w-full items-center rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-16 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:border-gray-300">
                Search releases, tickets, CRs...
              </span>
              <kbd className="absolute right-3 hidden rounded-md border border-gray-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-gray-500 shadow-sm sm:inline">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors lg:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <ThemeModeToggle />

            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors"
              aria-label="Help and navigation"
              title="Help & navigation"
            >
              <CircleHelp className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {mounted && unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white shadow-glow-brand animate-pulseDot">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>
              <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
            </div>

            <div className="ml-2 flex items-center gap-3 border-l border-gray-300/50 pl-4">
              <div className="rounded-full ring-2 ring-gray-100 p-0.5">
                <Avatar name="Priya Sharma" size="sm" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900">Priya Sharma</p>
                <p className="text-xs font-medium text-brand-600">Release Manager</p>
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
