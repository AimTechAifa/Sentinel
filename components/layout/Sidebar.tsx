"use client";

import { usePathname } from "next/navigation";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard, Package, Calendar, History, Plug, Settings,
  Bot, LineChart, Shield, Briefcase, Share2, Columns2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_TAGLINE } from "@/lib/brand";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/executive", label: "Executive", icon: Briefcase },
  { href: "/releases", label: "Releases", icon: Package },
  { href: "/compare", label: "Compare", icon: Columns2 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/knowledge-graph", label: "Knowledge Graph", icon: Share2 },
  { href: "/agents", label: "Agents", icon: Bot, pulse: true },
  { href: "/history", label: "History Log", icon: History },
  { href: "/connectors", label: "Connectors", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const wide = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200/80 bg-white/95 px-5 shadow-theme-sm backdrop-blur-xl transition-all duration-300 ease-in-out lg:mt-0",
        wide ? "w-[290px]" : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("flex py-8", !wide ? "lg:justify-center" : "justify-start")}>
        <ProgressLink href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-theme-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {wide && (
            <div>
              <span className="text-xl font-bold text-gray-800 tracking-tight">Sentinel</span>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{PRODUCT_TAGLINE}</p>
            </div>
          )}
        </ProgressLink>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar">
        <p className={cn("mb-3 text-xs font-semibold uppercase text-gray-400", !wide && "lg:hidden")}>
          Menu
        </p>
        <ul className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon, pulse }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <ProgressLink
                  href={href}
                  className={cn(
                    "menu-item group",
                    active ? "menu-item-active" : "menu-item-inactive",
                    !wide && "lg:justify-center"
                  )}
                >
                  <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                    <Icon className="h-5 w-5 shrink-0" />
                  </span>
                  {wide && <span className="flex-1">{label}</span>}
                  {wide && pulse && (
                    <span className="h-2 w-2 rounded-full bg-ai animate-pulseDot" />
                  )}
                </ProgressLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {wide && (
        <div className="border-t border-gray-200 py-4">
          <div className="rounded-2xl bg-brand-950 px-4 py-4">
            <p className="text-sm font-semibold text-white">Release Command Center</p>
            <p className="mt-1 text-xs text-gray-400">{PRODUCT_TAGLINE}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
