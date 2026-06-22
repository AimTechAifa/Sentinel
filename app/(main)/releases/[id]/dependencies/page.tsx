"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { ArrowLeft, Network } from "lucide-react";
import { ServiceNode } from "@/components/dependencies/ServiceNode";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { MagicCard } from "@/components/ui/magic-card";
import { TopBar } from "@/components/layout/TopBar";
import { callAgent } from "@/lib/agent-client";
import { releases, services } from "@/lib/dummy-data";
import type { DependencyWarning } from "@/lib/types";

const nodeTypes = { service: ServiceNode };

export default function DependenciesPage({ params }: { params: { id: string } }) {
  const release = releases.find((r) => r.id === params.id);
  const [warnings, setWarnings] = useState<DependencyWarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!release) return;
    callAgent({
      agentRole: "Dependency Agent",
      context: { release, services, touchedServices: services.filter((s) => release.dependsOnServices.includes(s.id)) },
      mode: "structured",
    }).then((res) => {
      if (res.warnings) setWarnings(res.warnings as DependencyWarning[]);
      setLoading(false);
    });
  }, [release]);

  const { nodes, edges } = useMemo(() => {
    if (!release) return { nodes: [], edges: [] };
    const touched = new Set(release.dependsOnServices);
    const ns: Node[] = services.map((s, i) => ({
      id: s.id,
      type: "service",
      data: { label: s.name, touched: touched.has(s.id), unstable: s.unstable },
      position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 120 },
    }));
    const es: Edge[] = services.flatMap((s) =>
      s.dependsOn.map((dep) => ({
        id: `${dep}-${s.id}`,
        source: dep,
        target: s.id,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#94A3B8" },
      }))
    );
    return { nodes: ns, edges: es };
  }, [release]);

  if (!release) return <p className="text-slate-500">Release not found.</p>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <ProgressLink href={`/releases/${release.id}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/80 bg-white/80 text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </ProgressLink>
        <TopBar
          title={`Dependency Map — ${release.version}`}
          subtitle="Services touched by this release highlighted in blue"
          className="mb-0 flex-1"
        />
      </div>
      <div className="flex flex-1 gap-4 min-h-0">
        <MagicCard gradient="from-brand-200/40 via-white to-violet-200/40" className="flex-1" innerClassName="h-full overflow-hidden">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
            <Background gap={16} color="#E2E8F0" />
            <Controls className="!rounded-xl" />
            <MiniMap className="!rounded-xl" />
          </ReactFlow>
        </MagicCard>
        <AdvancedCard
          title="Dependency Warnings"
          icon={Network}
          variant="ai"
          action={<AgentBadge agent="Dependency Agent" />}
          className="w-80 shrink-0"
          innerClassName="overflow-y-auto max-h-full"
        >
          {loading && <AICardSkeleton />}
          {!loading && warnings.map((w, i) => (
            <div key={i} className="rounded-xl border border-violet-100 bg-white/80 p-3 mb-3 text-sm backdrop-blur-sm">
              <p className="text-gray-700">{w.warning}</p>
              {w.citations?.length > 0 && <p className="text-xs text-gray-400 mt-2">{w.citations.join(" · ")}</p>}
            </div>
          ))}
          {!loading && warnings.length === 0 && <p className="text-sm text-gray-500">No dependency warnings.</p>}
        </AdvancedCard>
      </div>
    </div>
  );
}
