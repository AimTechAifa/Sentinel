import { Sparkles } from "lucide-react";
import type { AgentRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AgentBadge({ agent, className }: { agent: AgentRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "bg-gradient-to-r from-brand-50 to-brand-100/80 text-brand-600 border border-brand-200/80",
        "shadow-[0_0_12px_-4px_rgba(59,91,219,0.5)]",
        className
      )}
    >
      <Sparkles className="w-3 h-3 animate-pulse" />
      {agent}
    </span>
  );
}
