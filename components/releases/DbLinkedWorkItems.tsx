import { ExternalLink, Ticket } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { StatusBadge } from "@/components/badges/StatusBadge";

type WorkItem = {
  externalId: string;
  title: string;
  status: string;
  source: string;
  priority: string;
};

export function DbLinkedWorkItems({ items }: { items: WorkItem[] }) {
  return (
    <AdvancedCard title="Linked work items" subtitle="Read-only from Jira" icon={Ticket} variant="glass">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No linked Jira issues for this release code.</p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div
              key={t.externalId}
              className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="min-w-0">
                <a
                  href={`https://jira.example.com/browse/${t.externalId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-brand-600 hover:underline"
                >
                  {t.externalId}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <p className="text-sm text-gray-700 truncate">{t.title}</p>
                <span className="text-[10px] text-gray-400">{t.source} · {t.priority}</span>
              </div>
              <StatusBadge
                status={
                  t.status === "Closed" || t.status === "Done" || t.status === "Resolved"
                    ? "Approved"
                    : t.status === "Blocked"
                      ? "Blocked"
                      : "Pending"
                }
              />
            </div>
          ))}
        </div>
      )}
    </AdvancedCard>
  );
}
