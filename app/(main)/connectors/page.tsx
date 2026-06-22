import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { connectors } from "@/lib/dummy-data";
import { formatDateTime } from "@/lib/utils";

export default function ConnectorsPage() {
  return (
    <div>
      <TopBar title="Connectors" subtitle="All integrations live and connected" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectors.map((c) => (
          <div key={c.id} className="bg-white ta-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{c.name}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <StatusBadge status={c.status} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">{c.description}</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Token: <code className="bg-slate-100 px-1 rounded">{c.maskedToken}</code></p>
              <p>Last synced: {formatDateTime(c.lastSynced)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
