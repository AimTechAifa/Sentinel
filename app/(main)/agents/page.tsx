"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { agents } from "@/lib/dummy-data";
import { ArchitectureDiagram } from "@/components/agents/ArchitectureDiagram";
import { TicketAgentFindings } from "@/components/agents/TicketAgentFindings";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const [paused, setPaused] = useState<Record<string, boolean>>({});

  return (
    <div>
      <TopBar title="Agent Control Room" subtitle="Monitor and control Sentinel's AI agents" />
      <ArchitectureDiagram />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {agents.map((agent) => {
          const isPaused = paused[agent.id];
          return (
            <div key={agent.id} className={cn("ta-card transition-opacity", isPaused && "opacity-60")}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <AgentBadge agent={agent.name} />
                  <p className="text-xs text-gray-500 mt-2">Watches: {agent.watches}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={!isPaused} onChange={() => setPaused((p) => ({ ...p, [agent.id]: !p[agent.id] }))} className="sr-only peer" />
                  <div className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer" />
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{isPaused ? "Paused" : `Active — last ran ${agent.lastRanMinutesAgo} min ago`}</span>
                {isPaused && <span className="bg-slate-100 text-gray-600 px-2 py-0.5 rounded-full">Paused</span>}
              </div>
              <div className="flex items-end gap-0.5 h-8 mb-3">
                {agent.sparkline.map((v, i) => (
                  <div key={i} className="flex-1 bg-ai/20 rounded-sm" style={{ height: `${(v / 12) * 100}%` }} />
                ))}
              </div>
              {agent.name === "Ticket Agent" ? (
                <TicketAgentFindings agent={agent} />
              ) : (
                <details className="text-sm">
                  <summary className="cursor-pointer text-ai font-medium">View recent findings</summary>
                  <ul className="mt-2 space-y-2">
                    {agent.sampleFindings.map((f, i) => (
                      <li key={i} className="text-gray-600 text-xs border-l-2 border-violet-200 pl-2">{f.text}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
