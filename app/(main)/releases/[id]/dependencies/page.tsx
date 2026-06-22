"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { ProgressLink } from "@/components/layout/NavigationProgress";
import { ArrowLeft } from "lucide-react";
import { ServiceNode } from "@/components/dependencies/ServiceNode";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
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
        <ProgressLink href={`/releases/${release.id}`} className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></ProgressLink>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dependency Map — {release.version}</h1>
          <p className="text-sm text-slate-500">Services touched by this release highlighted in blue</p>
        </div>
      </div>
      <div className="flex flex-1 gap-4 min-h-0">
        <div className="flex-1 bg-white border border-border rounded-xl overflow-hidden">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        <div className="w-80 bg-white border border-border rounded-xl p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Dependency Warnings</h3>
            <AgentBadge agent="Dependency Agent" />
          </div>
          {loading && <AICardSkeleton />}
          {!loading && warnings.map((w, i) => (
            <div key={i} className="ai-card p-3 mb-3 text-sm">
              <p className="text-slate-700">{w.warning}</p>
              {w.citations?.length > 0 && <p className="text-xs text-slate-400 mt-2">{w.citations.join(" · ")}</p>}
            </div>
          ))}
          {!loading && warnings.length === 0 && <p className="text-sm text-slate-500">No dependency warnings.</p>}
        </div>
      </div>
    </div>
  );
}
