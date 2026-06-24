"use client";

import { useCallback, useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AdvancedCard } from "@/components/ui/advanced-card";
import { AnalyseRiskSection } from "@/components/system-mapping/AnalyseRiskSection";
import { CurrentMappingSection } from "@/components/system-mapping/CurrentMappingSection";
import { GenerateMappingPanel } from "@/components/system-mapping/GenerateMappingPanel";
import type { MappingGroupRow } from "@/lib/system-mapping-types";
import type { SessionUser } from "@/lib/auth/roles";

export default function SystemMappingPage() {
  const [groups, setGroups] = useState<MappingGroupRow[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [highlightEdgeId, setHighlightEdgeId] = useState<string | null>(null);

  const canEdit = user?.role === "editor" || user?.role === "admin";

  const loadGroups = useCallback(() => {
    fetch("/api/system-mapping/groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []));
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    loadGroups();
  }, [loadGroups]);

  const deleteGroup = async (id: string) => {
    await fetch(`/api/system-mapping/groups/${id}`, { method: "DELETE" });
    loadGroups();
  };

  return (
    <div className="space-y-6">
      <TopBar
        title="System Mapping"
        subtitle="Document environment dependencies, generate mappings from notes, and analyse booking conflicts"
        highlight
      />

      <AdvancedCard title="What is this?" variant="glass">
        <p className="text-sm text-gray-600 leading-relaxed">
          System mapping records <strong>upstream → downstream</strong> links between application environments
          (e.g. FIN UAT consumes SAP TEST). Saved mapping groups are the trusted architecture source. Use{" "}
          <strong>Analyse mapping risk</strong> to flag when required environments are booked during your test window.
        </p>
      </AdvancedCard>

      <CurrentMappingSection
        groups={groups}
        canEdit={canEdit}
        onAddNew={() => setPanelOpen(true)}
        onDeleteGroup={deleteGroup}
        highlightEdgeId={highlightEdgeId}
      />

      <AnalyseRiskSection onHighlightEdge={setHighlightEdgeId} />

      <GenerateMappingPanel
        open={panelOpen}
        canEdit={canEdit}
        onClose={() => setPanelOpen(false)}
        onSaved={loadGroups}
      />
    </div>
  );
}
