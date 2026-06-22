import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { teamMembers } from "@/lib/dummy-data";

export default function SettingsPage() {
  return (
    <div>
      <TopBar title="Settings" subtitle="Team and role configuration" />
      <div className="bg-white ta-card p-5 max-w-2xl">
        <h3 className="font-semibold text-gray-800 mb-4">Team Members</h3>
        <div className="space-y-3">
          {teamMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              <Avatar name={m.name} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{m.name}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <span className="text-xs bg-slate-100 text-gray-600 px-2 py-1 rounded-full">{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
