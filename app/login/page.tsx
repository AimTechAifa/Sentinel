"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useNavigationProgress } from "@/components/layout/NavigationProgress";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShimmerText } from "@/components/ui/shimmer-text";
import { MagicCard } from "@/components/ui/magic-card";
import { taBtnPrimary, taInput } from "@/lib/styles";
import { PRODUCT_TAGLINE } from "@/lib/brand";

export default function LoginPage() {
  const router = useRouter();
  const { start } = useNavigationProgress();

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-brand-50/30 to-violet-50/40 lg:flex-row overflow-hidden">
      <DotPattern className="opacity-20" />
      <div className="relative flex flex-1 flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-theme-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <ShimmerText className="text-2xl font-bold">Sentinel</ShimmerText>
              <p className="mt-0.5 text-xs text-gray-500">{PRODUCT_TAGLINE}</p>
            </div>
          </div>
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800">Sign In</h1>
          <p className="mb-8 text-sm text-gray-500">
            AI-powered release command center for engineering teams
          </p>
          <MagicCard gradient="from-brand-200/50 via-white to-violet-200/50" innerClassName="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                start();
                router.push("/dashboard");
              }}
              className="space-y-5"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input defaultValue="priya@company.com" className={taInput} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <input type="password" defaultValue="demo" className={taInput} />
              </div>
              <button type="submit" className={`${taBtnPrimary} w-full`}>
                Sign in
              </button>
            </form>
          </MagicCard>
        </motion.div>
      </div>

      <div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-violet-950 lg:flex overflow-hidden">
        <DotPattern className="opacity-10" opacity={0.15} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-md px-12 text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/20 ring-1 ring-brand-400/30 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-brand-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">Release with confidence</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            Sentinel brings together approvals, builds, dependencies, and AI agents in one
            command center — so you always know if it&apos;s safe to ship.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
