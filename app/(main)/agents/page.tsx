"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { agents } from "@/lib/dummy-data";
import { ArchitectureDiagram } from "@/components/agents/ArchitectureDiagram";
import { AgentActivityMarquee } from "@/components/agents/AgentActivityMarquee";
import { AgentControlHero } from "@/components/agents/AgentControlHero";
import { AgentCard } from "@/components/agents/AgentCard";

export default function AgentsPage() {
  const [paused, setPaused] = useState<Record<string, boolean>>({});

  const featured = new Set(["ag5", "ag10", "ag7"]);

  return (
    <div className="relative">
      <TopBar title="Agent Control Room" subtitle="Flashy fleet dashboard — 21st.dev-inspired UI" />
      <AgentControlHero />
      <AgentActivityMarquee />
      <ArchitectureDiagram />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isPaused={!!paused[agent.id]}
            onTogglePause={() => setPaused((p) => ({ ...p, [agent.id]: !p[agent.id] }))}
            featured={featured.has(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}
