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
  /** Soft Materio card (default) vs animated gradient border */
  variant?: "soft" | "magic";
}

function PanelBody({
  title,
  agent,
  children,
  loading,
  error,
}: Pick<AIPanelProps, "title" | "agent" | "children" | "loading" | "error">) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <AgentBadge agent={agent} />
      </div>
      {loading && <AICardSkeleton />}
      {error && !loading && <p className="text-sm text-error-600">{error}</p>}
      {children && !loading && (
        <div className={cn(!error && "text-sm leading-relaxed text-gray-600")}>{children}</div>
      )}
    </>
  );
}

export function AIPanel({
  title,
  agent,
  children,
  loading,
  error,
  className,
  variant = "soft",
}: AIPanelProps) {
  if (variant === "magic") {
    return (
      <MagicCard
        gradient="from-brand-400 via-brand-500 to-brand-600"
        beam
        glow
        className={className}
        innerClassName="p-5 md:p-6"
      >
        <PanelBody title={title} agent={agent} loading={loading} error={error}>
          {children}
        </PanelBody>
      </MagicCard>
    );
  }

  return (
    <div className={cn("ta-card ai-card", className)}>
      <PanelBody title={title} agent={agent} loading={loading} error={error}>
        {children}
      </PanelBody>
    </div>
  );
}
