"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { GitBranch } from "lucide-react";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { EnterpriseSystemNode } from "@/lib/types";

const nodeStyles = {
  environment: "bg-brand-50 border-brand-300 text-brand-800",
  application: "bg-violet-50 border-violet-300 text-violet-800",
};

function SystemMapNode({ data }: { data: { label: string; nodeType: "environment" | "application" } }) {
  return (
    <div
      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold shadow-sm min-w-[120px] text-center ${nodeStyles[data.nodeType]}`}
    >
      {data.label}
    </div>
  );
}

const nodeTypes = { systemMap: SystemMapNode };

export function SystemMappingView({ nodes: systemNodes }: { nodes: EnterpriseSystemNode[] }) {
  const { nodes, edges } = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {
      "test-sap": { x: 200, y: 20 },
      "uat-asset": { x: 80, y: 140 },
      "dev-oracle": { x: 320, y: 140 },
      "prod-sap": { x: 200, y: 260 },
      "prod-oracle": { x: 320, y: 360 },
      "app-fin": { x: 20, y: 260 },
      "app-crm": { x: 480, y: 260 },
    };

    const ns: Node[] = systemNodes.map((n) => ({
      id: n.id,
      type: "systemMap",
      data: { label: n.label, nodeType: n.type },
      position: positions[n.id] ?? { x: 0, y: 0 },
    }));

    const es: Edge[] = systemNodes
      .filter((n) => n.parentId)
      .map((n) => ({
        id: `${n.parentId}-${n.id}`,
        source: n.parentId!,
        target: n.id,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748B" },
        style: { stroke: "#94A3B8", strokeWidth: 2 },
        animated: n.type === "environment",
      }));

    return { nodes: ns, edges: es };
  }, [systemNodes]);

  return (
    <AdvancedCard
      title="System Mapping"
      subtitle="Enterprise environment topology — TEST SAP, UAT, DEV Oracle, and downstream apps"
      icon={GitBranch}
      variant="glass"
      noPadding
    >
      <div className="h-[420px] border-t border-gray-100">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}>
          <Background gap={16} color="#E2E8F0" />
          <Controls className="!rounded-xl" />
        </ReactFlow>
      </div>
      <div className="flex gap-4 px-5 py-3 text-[10px] text-gray-500 border-t border-gray-100">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded border-2 border-brand-300 bg-brand-50" /> Environment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-6 rounded border-2 border-violet-300 bg-violet-50" /> Application
        </span>
      </div>
    </AdvancedCard>
  );
}
