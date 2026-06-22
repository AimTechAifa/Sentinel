"use client";

import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { teamMembers } from "@/lib/dummy-data";
import { Users } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <TopBar title="Settings" subtitle="Team and role configuration" highlight />
      <AdvancedCard title="Team Members" icon={Users} variant="glass" className="max-w-2xl">
        <div className="space-y-3">
          {teamMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 hover:bg-brand-50/30 rounded-lg px-2 -mx-2 transition-colors">
              <Avatar name={m.name} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{m.name}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <span className="text-xs bg-gradient-to-r from-slate-100 to-brand-50 text-gray-600 px-2.5 py-1 rounded-full border border-gray-100">{m.role}</span>
            </div>
          ))}
        </div>
      </AdvancedCard>
    </div>
  );
}
