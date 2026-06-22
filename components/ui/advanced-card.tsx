"use client";

import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import type { LucideIcon } from "lucide-react";

type Variant = "default" | "ai" | "glass" | "plain";

const GRADIENTS: Record<Exclude<Variant, "plain">, string> = {
  default: "from-gray-200/80 via-white to-gray-200/80",
  ai: "from-violet-500 via-brand-500 to-cyan-400",
  glass: "from-brand-300/40 via-violet-300/30 to-cyan-300/40",
};

interface AdvancedCardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  variant?: Variant;
  beam?: boolean;
  glow?: boolean;
  noPadding?: boolean;
}

export function AdvancedCard({
  children,
  className,
  innerClassName,
  title,
  subtitle,
  icon: Icon,
  action,
  variant = "default",
  beam = false,
  glow,
  noPadding = false,
}: AdvancedCardProps) {
  const header = (title || Icon || action) && (
    <div className={cn("flex items-start justify-between gap-3", !noPadding && "mb-4")}>
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-violet-50">
            <Icon className="h-4 w-4 text-brand-600" />
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="font-semibold text-gray-800 truncate">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );

  if (variant === "plain") {
    return (
      <div className={cn("ta-card", className, innerClassName)}>
        {header}
        {children}
      </div>
    );
  }

  return (
    <MagicCard
      gradient={GRADIENTS[variant]}
      beam={beam || variant === "ai"}
      glow={glow ?? variant === "ai"}
      className={className}
      innerClassName={cn(!noPadding && "p-5 md:p-6", innerClassName)}
    >
      {header}
      {children}
    </MagicCard>
  );
}
