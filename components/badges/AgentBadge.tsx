import { Sparkles } from "lucide-react";
import type { AgentRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AgentBadge({ agent, className }: { agent: AgentRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "bg-gradient-to-r from-violet-100 to-brand-50 text-ai border border-violet-200/80",
        "shadow-[0_0_12px_-4px_rgba(122,90,248,0.5)]",
        className
      )}
    >
      <Sparkles className="w-3 h-3 animate-pulse" />
      {agent}
    </span>
  );
}
