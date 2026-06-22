"use client";

import { activityFeed } from "@/lib/dummy-data";
import { Marquee } from "@/components/ui/marquee";
import { AgentBadge } from "@/components/badges/AgentBadge";
import type { AgentRole } from "@/lib/types";

export function AgentActivityMarquee() {
  const items = activityFeed.filter((a) => a.type === "agent" && a.agent).slice(0, 12);

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-brand-50/80 py-3">
      <Marquee pauseOnHover className="[--gap:2rem]">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 shrink-0 px-2">
            {item.agent && <AgentBadge agent={item.agent as AgentRole} className="shrink-0" />}
            <span className="text-xs text-gray-600 whitespace-nowrap max-w-[280px] truncate">{item.message}</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
