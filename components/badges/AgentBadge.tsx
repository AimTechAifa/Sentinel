import { Sparkles } from "lucide-react";
import type { AgentRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AgentBadge({ agent, className }: { agent: AgentRole; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-100 text-ai border border-violet-200", className)}>
      <Sparkles className="w-3 h-3" />
      {agent}
    </span>
  );
}
