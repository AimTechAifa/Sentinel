import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { connectors } from "@/lib/dummy-data";
import type { ConnectorCategory } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const CATEGORY_ORDER: ConnectorCategory[] = [
  "Issue Tracking",
  "Source Control",
  "CI/CD",
  "Change Management",
  "Monitoring",
  "Incident",
  "Security",
  "Documentation",
  "Communication",
  "Deployment",
  "Artifact Registry",
  "Feature Flags",
  "Secrets & Config",
];

const statusDot: Record<string, string> = {
  Connected: "bg-emerald-500",
  Disconnected: "bg-gray-400",
  Error: "bg-error-500",
};

export default function ConnectorsPage() {
  const connected = connectors.filter((c) => c.status === "Connected").length;
  const errors = connectors.filter((c) => c.status === "Error").length;
  const disconnected = connectors.filter((c) => c.status === "Disconnected").length;

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    items: connectors.filter((c) => c.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <TopBar
        title="Connectors"
        subtitle={`${connectors.length} integrations · ${connected} connected · ${errors} error · ${disconnected} disconnected`}
      />

      <div className="space-y-8">
        {byCategory.map(({ category, items }) => (
          <section key={category}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((c) => (
                <div key={c.id} className="bg-white ta-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{c.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusDot[c.status]}`} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{c.description}</p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>
                      Token: <code className="bg-slate-100 px-1 rounded">{c.maskedToken}</code>
                    </p>
                    <p>Last synced: {formatDateTime(c.lastSynced)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
