"use client";

import { useEffect, useState } from "react";
import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { callAgent } from "@/lib/agent-client";
import type { Release, RiskFlag } from "@/lib/types";
import { medianFilesChanged } from "@/lib/utils";
import { releases } from "@/lib/dummy-data";
import { ChevronDown, ChevronUp } from "lucide-react";

export function AIRiskPanel({ release }: { release: Release }) {
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const median = medianFilesChanged(releases);

  useEffect(() => {
    callAgent({
      agentRole: "Risk Agent",
      context: { release, medianFilesChanged: median, similarReleaseCount: 14 },
      mode: "structured",
    }).then((res) => {
      if (res.flags) setFlags(res.flags as RiskFlag[]);
      else setError(res.error ?? "Unable to load risk analysis");
      setLoading(false);
    });
  }, [release, median]);

  return (
    <div className="space-y-3">
      <div className="ai-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">AI Risk Analysis</h3>
          <AgentBadge agent="Risk Agent" />
        </div>
        {loading && <AICardSkeleton />}
        {error && !loading && <p className="text-sm text-error-600">{error}</p>}
        {!loading && !error && (
          <ul className="space-y-3">
            {flags.map((f, i) => (
              <li key={i} className="border border-violet-100 rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm text-gray-800">{f.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.severity === "high" ? "bg-red-100 text-red-700" : f.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-gray-600"}`}>{f.severity}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{f.explanation}</p>
                {f.citations?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">Sources: {f.citations.join(" · ")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={() => setShowReasoning(!showReasoning)} className="flex items-center gap-1 text-sm text-ai hover:text-violet-800">
        {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        View AI reasoning
      </button>
      {showReasoning && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1">
          <p>Compared against 14 similar past releases in Platform team.</p>
          <p>Flagged because: file-change count ({release.filesChanged} vs ~{median} median), service criticality, pending Security approval duration.</p>
          <p>Release touches {release.dependsOnServices.length} services with {release.incidentHistory.length} prior incident(s) on record.</p>
        </div>
      )}
    </div>
  );
}
