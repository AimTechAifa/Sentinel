"use client";

import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/ui/border-beam";

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  gradient?: string;
  beam?: boolean;
  glow?: boolean;
}

/** Gradient-border card inspired by Magic UI / 21st.dev */
export function MagicCard({
  children,
  className,
  innerClassName,
  gradient = "from-violet-500 via-brand-500 to-cyan-400",
  beam = false,
  glow = false,
}: MagicCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-[1px] bg-gradient-to-br shadow-theme-md transition-shadow hover:shadow-theme-md",
        gradient,
        glow && "shadow-[0_0_40px_-12px_rgba(122,90,248,0.45)]",
        className
      )}
    >
      {beam && <BorderBeam />}
      <div className={cn("relative rounded-2xl bg-white/95 backdrop-blur-sm h-full overflow-hidden", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
