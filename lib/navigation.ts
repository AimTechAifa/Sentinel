import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Calendar,
  History,
  Plug,
  Settings,
  Bot,
  LineChart,
  Briefcase,
  Share2,
  Columns2,
  Sparkles,
  Server,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  pulse?: boolean;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/templates", label: "Templates", icon: Sparkles, pulse: true },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { href: "/executive", label: "Executive", icon: Briefcase },
      { href: "/releases", label: "Releases", icon: Package },
      { href: "/compare", label: "Compare", icon: Columns2 },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/environments", label: "Environment Desk", icon: Server },
      { href: "/insights", label: "Insights", icon: LineChart },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/knowledge-graph", label: "Knowledge Graph", icon: Share2 },
      { href: "/agents", label: "Agents", icon: Bot, pulse: true },
      { href: "/history", label: "History Log", icon: History },
      { href: "/connectors", label: "Connectors", icon: Plug },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);
