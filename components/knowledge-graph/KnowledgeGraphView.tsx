"use client";

import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, MarkerType, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import { KgNode } from "@/components/knowledge-graph/KgNode";
import { buildKnowledgeGraph, KG_LEGEND, layoutKgNodes } from "@/lib/knowledge-graph";
import { releases, services, teamMembers } from "@/lib/dummy-data";
import type { KgNodeType } from "@/lib/types";
import { cn } from "@/lib/utils";

const nodeTypes = { kg: KgNode };

const ALL_TYPES: KgNodeType[] = ["person", "release", "service", "ticket", "change", "incident"];

export function KnowledgeGraphView() {
  const [filters, setFilters] = useState<Set<KgNodeType>>(() => new Set(ALL_TYPES));

  const { nodes, edges } = useMemo(() => {
    const { nodes: kgNodes, edges: kgEdges } = buildKnowledgeGraph(releases, services, teamMembers);
    const positions = layoutKgNodes(kgNodes);
    const visibleIds = new Set(kgNodes.filter((n) => filters.has(n.type)).map((n) => n.id));

    kgEdges.forEach((e) => {
      if (visibleIds.has(e.source)) visibleIds.add(e.target);
      if (visibleIds.has(e.target)) visibleIds.add(e.source);
    });

    const ns: Node[] = kgNodes
      .filter((n) => visibleIds.has(n.id))
      .map((n) => ({
        id: n.id,
        type: "kg",
        position: positions.get(n.id) ?? { x: 0, y: 0 },
        data: {
          label: n.label,
          sublabel: n.sublabel,
          nodeType: n.type,
          href: n.href,
          meta: n.meta,
        },
      }));

    const es: Edge[] = kgEdges
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { stroke: "#94A3B8", strokeWidth: 1.5 },
        labelStyle: { fontSize: 9, fill: "#64748B" },
      }));

    return { nodes: ns, edges: es };
  }, [filters]);

  const toggle = (type: KgNodeType) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next.size === 0 ? new Set(ALL_TYPES) : next;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {KG_LEGEND.map(({ type, label, color }) => (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              filters.has(type) ? "bg-white border-gray-200 text-gray-700" : "bg-gray-100 border-transparent text-gray-400"
            )}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            {label}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{nodes.length} nodes · {edges.length} edges</span>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden min-h-[480px]">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.3}>
          <Background gap={16} />
          <Controls />
          <MiniMap nodeStrokeWidth={2} zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  );
}
