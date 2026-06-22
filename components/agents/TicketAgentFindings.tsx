"use client";

import { useState } from "react";
import { callAgent } from "@/lib/agent-client";
import { releases } from "@/lib/dummy-data";
import { AISkeleton } from "@/components/ui/AISkeleton";
import type { AgentMeta } from "@/lib/types";

export function TicketAgentFindings({ agent }: { agent: AgentMeta }) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFindings = () => {
    if (summary || error || loading) return;
    setLoading(true);
    const context = {
      releases: releases
        .filter((r) => r.tickets.some((t) => t.status !== "Done"))
        .map((r) => ({
          id: r.id,
          version: r.version,
          team: r.team,
          status: r.status,
          targetDate: r.targetDate,
          tickets: r.tickets,
        })),
      sampleFindings: agent.sampleFindings,
    };
    callAgent({ agentRole: "Ticket Agent", context }).then((res) => {
      if (res.text) setSummary(res.text);
      else setError(res.error ?? "AI unavailable");
      setLoading(false);
    });
  };

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const open = e.currentTarget.open;
    setExpanded(open);
    if (open) fetchFindings();
  };

  return (
    <details className="text-sm" onToggle={handleToggle}>
      <summary className="cursor-pointer text-ai font-medium">View recent findings</summary>
      <div className="mt-2 space-y-2">
        {expanded && loading && <AISkeleton lines={3} />}
        {expanded && error && !loading && <p className="text-xs text-error-600">{error}</p>}
        {expanded && summary && !loading && (
          <p className="text-gray-600 text-xs border-l-2 border-violet-200 pl-2 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        )}
      </div>
    </details>
  );
}
