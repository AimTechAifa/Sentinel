"use client";

import { useEffect, useMemo, useState } from "react";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { SourceBadgeInline } from "@/components/dashboard/UnifiedPortfolioPanel";
import { TopBar } from "@/components/layout/TopBar";
import { ReleaseFiltersBar } from "@/components/releases/ReleaseFiltersBar";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, tableCell, tableHeadRow, tableRow } from "@/components/ui/data-table";
import { filterLabel } from "@/lib/release-filters";
import {
  inboxSectionLabel,
  inboxSectionOrder,
  type InboxItem,
  type InboxSection,
} from "@/lib/inbox-shared";
import { useReleaseFilters } from "@/context/ReleaseFiltersContext";
import { formatDate, cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarClock,
  GitBranch,
  Inbox,
  Package,
  Ticket,
  User,
} from "lucide-react";

type Period = "month" | "quarter" | "year";

type InboxData = {
  counts: Record<InboxSection, number>;
  items: InboxItem[];
};

const SECTION_ICONS: Record<InboxSection, typeof AlertTriangle> = {
  attention: AlertTriangle,
  p1: Ticket,
  approaching: CalendarClock,
  mapping: GitBranch,
  approvals: Package,
  mine: User,
};

const SECTION_FILTERS: { id: InboxSection | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attention", label: "Blocked & at risk" },
  { id: "p1", label: "P1 issues" },
  { id: "approaching", label: "Undecided soon" },
  { id: "mapping", label: "Mapping" },
  { id: "approvals", label: "Approvals" },
  { id: "mine", label: "My releases" },
];

export function MorningInboxView() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<InboxSection | "all">("all");
  const { filterQuery, filters, departments, applications, environments, hasRefinement } =
    useReleaseFilters();

  const scopeLabel = useMemo(
    () => filterLabel(filters, departments, applications, environments),
    [filters, departments, applications, environments]
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/inbox?period=${period}${filterQuery}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (payload) {
          setData({ counts: payload.counts, items: payload.items });
        }
        setLoading(false);
      });
  }, [period, filterQuery]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (section === "all") return data.items;
    return data.items.filter((i) => i.section === section);
  }, [data, section]);

  const grouped = useMemo(() => {
    const map = new Map<InboxSection, InboxItem[]>();
    filtered.forEach((item) => {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    });
    return Array.from(map.entries()).sort(
      (a, b) => inboxSectionOrder(a[0]) - inboxSectionOrder(b[0])
    );
  }, [filtered]);

  const totalCount = data?.items.length ?? 0;
  const attentionCount = data?.counts.attention ?? 0;

  return (
    <div className="space-y-6">
      <TopBar
        title="Morning Inbox"
        subtitle={
          hasRefinement
            ? `Action items for ${scopeLabel} — blocked releases, P1s, mapping conflicts, and more`
            : "Your daily action queue — blocked releases, P1s, mapping conflicts, and approvals"
        }
        highlight
      />

      <ReleaseFiltersBar />

      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white/80 p-1 w-fit">
        {(["month", "quarter", "year"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              period === p ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total items"
          value={loading ? "…" : String(totalCount)}
          icon={Inbox}
        />
        <MetricCard
          label="Blocked & at risk"
          value={loading ? "…" : String(attentionCount)}
          icon={AlertTriangle}
          trend={attentionCount ? "down" : "neutral"}
        />
        <MetricCard
          label="Open P1s"
          value={loading ? "…" : String(data?.counts.p1 ?? 0)}
          icon={Ticket}
        />
        <MetricCard
          label="Mapping conflicts"
          value={loading ? "…" : String(data?.counts.mapping ?? 0)}
          icon={GitBranch}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTION_FILTERS.map((f) => {
          const count =
            f.id === "all" ? totalCount : data?.counts[f.id as InboxSection] ?? 0;
          const active = section === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSection(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                active
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-gray-200 text-gray-600 hover:border-brand-300"
              )}
            >
              {f.label}
              {count > 0 && <span className="ml-1 opacity-80">({count})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading inbox…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center">
          <p className="text-emerald-800 font-medium">Inbox clear for this scope</p>
          <p className="text-sm text-emerald-700/80 mt-1">
            No action items match your filters. Check the{" "}
            <ProgressLink href="/dashboard" className="underline font-medium">
              Dashboard
            </ProgressLink>{" "}
            for portfolio overview.
          </p>
        </div>
      ) : section === "all" ? (
        <div className="space-y-6">
          {grouped.map(([sec, items]) => (
            <InboxSectionTable key={sec} section={sec} items={items} />
          ))}
        </div>
      ) : (
        <InboxSectionTable section={section as InboxSection} items={filtered} />
      )}
    </div>
  );
}

function InboxSectionTable({ section, items }: { section: InboxSection; items: InboxItem[] }) {
  const Icon = SECTION_ICONS[section];

  return (
    <DataTable
      title={inboxSectionLabel(section)}
      subtitle={`${items.length} item${items.length === 1 ? "" : "s"} requiring attention`}
      icon={Icon}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className={tableHeadRow}>
            <th className={cn(tableCell, "text-left")}>Item</th>
            <th className={cn(tableCell, "text-left")}>Why</th>
            <th className={cn(tableCell, "text-left")}>Responsible</th>
            <th className={cn(tableCell, "text-left")}>When</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={tableRow}>
              <td className={tableCell}>
                <div className="flex items-center gap-2 flex-wrap">
                  <SourceBadgeInline source={item.source} />
                  <ProgressLink href={item.href} className="font-medium text-brand-600 hover:underline">
                    {item.title}
                  </ProgressLink>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
              </td>
              <td className={cn(tableCell, "text-xs text-gray-600 max-w-[240px]")}>{item.reason}</td>
              <td className={cn(tableCell, "font-medium text-gray-800")}>{item.responsible}</td>
              <td className={cn(tableCell, "text-xs text-gray-500")}>
                {item.date ? formatDate(item.date) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTable>
  );
}
