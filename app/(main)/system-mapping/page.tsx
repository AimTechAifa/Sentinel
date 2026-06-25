"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, MarkerType, type NodeMouseHandler, Panel, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import { Search, Map as MapIcon, ShieldAlert, Plus } from "lucide-react";
import { ServiceNode } from "@/components/dependencies/ServiceNode";
import { GenerateMappingPanel } from "@/components/system-mapping/GenerateMappingPanel";
import { AnalyseRiskSection } from "@/components/system-mapping/AnalyseRiskSection";
import type { MappingGroupRow } from "@/lib/system-mapping-types";
import type { SessionUser } from "@/lib/auth/roles";

const nodeTypes = { service: ServiceNode };

// Mock data generator for beautiful nodes
function getMockData(id: string) {
  const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const code = `ENV-0${(hash % 9000) + 1000}`;
  
  return {
    code,
    statusType: hash % 3 === 0 ? "critical" : hash % 2 === 0 ? "stable" : "staging" as const,
    versionStr: hash % 3 === 0 ? "Critical System" : hash % 2 === 0 ? "Stable Env" : "Staging Env",
  };
}

export default function SystemMappingPage() {
  const [groups, setGroups] = useState<MappingGroupRow[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<"risk" | "none">("none");

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const loadGroups = useCallback(() => {
    fetch("/api/system-mapping/groups")
      .then((r) => r.json())
      .then((d) => {
        const loaded = d.groups ?? [];
        setGroups(loaded);
        if (loaded.length > 0 && !activeGroupId) {
          setActiveGroupId(loaded[0].id);
        }
      });
  }, [activeGroupId]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    loadGroups();
  }, [loadGroups]);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  useEffect(() => {
    if (!activeGroup) {
      setNodes([]);
      setEdges([]);
      return;
    }
    
    const nodeMap = new Map<string, { label: string; kind: "app" | "env" }>();
    activeGroup.edges.forEach((e) => {
      const srcKey = `${e.sourceApp?.name ?? "?"}:${e.sourceEnv?.name ?? "?"}`;
      const tgtKey = `${e.targetApp?.name ?? "?"}:${e.targetEnv?.name ?? "?"}`;
      if (!nodeMap.has(srcKey)) nodeMap.set(srcKey, { label: `${e.sourceApp?.name} - ${e.sourceEnv?.name}`, kind: "env" });
      if (!nodeMap.has(tgtKey)) nodeMap.set(tgtKey, { label: `${e.targetApp?.name} - ${e.targetEnv?.name}`, kind: "env" });
    });

    const keys = Array.from(nodeMap.keys());
    const ns: Node[] = keys.map((key, i) => {
      const meta = nodeMap.get(key)!;
      const mock = getMockData(key);
      return {
        id: key,
        type: "service",
        data: {
          label: meta.label,
          code: mock.code,
          statusType: mock.statusType,
          versionStr: mock.versionStr,
          selected: false,
        },
        position: { x: (i % 4) * 350, y: Math.floor(i / 4) * 180 }, // Horizontal grid layout
      };
    });

    const es: Edge[] = activeGroup.edges.map((e, i) => {
      const srcKey = `${e.sourceApp?.name ?? "?"}:${e.sourceEnv?.name ?? "?"}`;
      const tgtKey = `${e.targetApp?.name ?? "?"}:${e.targetEnv?.name ?? "?"}`;
      return {
        id: `e-${i}`,
        source: srcKey,
        target: tgtKey,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" },
        style: { stroke: "#94A3B8", strokeWidth: 1.5, strokeDasharray: "5 5" },
      };
    });

    setNodes(ns);
    setEdges(es);
  }, [activeGroup, setNodes, setEdges]);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-gray-50/50 -m-8 p-8">
      {/* Top Header matching screenshot layout */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-theme-sm border border-gray-200">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            System Mapping <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full">ENTERPRISE</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-2">
            <MapIcon className="w-3 h-3" /> Architecture topology source of truth
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
            value={activeGroupId || ""}
            onChange={(e) => setActiveGroupId(e.target.value)}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {canEdit && (
            <button 
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Mapping
            </button>
          )}
          <button 
            onClick={() => setActiveSidePanel(prev => prev === "risk" ? "none" : "risk")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-warning-500" /> Analyse Risk
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 relative">
        {/* Full Canvas */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-theme-sm border border-gray-200 bg-[#fbfcfd]">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes} 
            fitView
          >
            <Background gap={16} color="#E2E8F0" />
            <Controls className="!rounded-xl shadow-theme-md border-gray-200" position="top-right" />
            
            {/* Map Legend */}
            <Panel position="bottom-left" className="bg-white rounded-xl shadow-theme-lg border border-gray-200 p-4 w-48 m-6">
              <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">Map Legend</h3>
              <div className="space-y-2 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-success-500" /> Stable Env</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Staging Env</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-warning-500" /> Critical System</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Floating Side Panels */}
        {activeSidePanel === "risk" && (
          <div className="w-96 shrink-0 flex flex-col gap-4 min-h-0 overflow-y-auto animate-in slide-in-from-right-8 duration-300">
            <AnalyseRiskSection onHighlightEdge={() => {}} />
          </div>
        )}
      </div>
      
      <GenerateMappingPanel
        open={panelOpen}
        canEdit={canEdit}
        onClose={() => setPanelOpen(false)}
        onSaved={loadGroups}
      />
    </div>
  );
}
