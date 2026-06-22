"use client";

import { AgentBadge } from "@/components/badges/AgentBadge";
import { AICardSkeleton } from "@/components/ui/AISkeleton";
import { MagicCard } from "@/components/ui/magic-card";
import type { AgentRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AIPanelProps {
  title: string;
  agent: AgentRole;
  children?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function AIPanel({ title, agent, children, loading, error, className }: AIPanelProps) {
  return (
    <MagicCard
      gradient="from-violet-500 via-brand-500 to-cyan-400"
      beam
      glow
      className={className}
      innerClassName="p-5 md:p-6"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <AgentBadge agent={agent} />
      </div>
      {loading && <AICardSkeleton />}
      {error && !loading && <p className="text-sm text-error-600">{error}</p>}
      {children && !loading && <div className={cn(!error && "text-sm leading-relaxed text-gray-600")}>{children}</div>}
    </MagicCard>
  );
}
