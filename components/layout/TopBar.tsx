"use client";

import { motion } from "framer-motion";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShimmerText } from "@/components/ui/shimmer-text";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  subtitle?: string;
  highlight?: boolean;
  badge?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, highlight = false, badge, className }: TopBarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl border border-gray-100/80 bg-white/70 p-5 shadow-theme-sm backdrop-blur-md md:p-6",
        className
      )}
    >
      <DotPattern className="opacity-[0.25]" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          {highlight ? (
            <ShimmerText className="text-title-sm font-bold">{title}</ShimmerText>
          ) : (
            <h1 className="text-title-sm font-bold text-gray-800">{title}</h1>
          )}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {badge}
      </div>
    </motion.header>
  );
}
