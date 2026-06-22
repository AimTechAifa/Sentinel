"use client";

import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useNavigationProgress } from "@/components/layout/NavigationProgress";
import { taBtnPrimary, taInput } from "@/lib/styles";

export default function LoginPage() {
  const router = useRouter();
  const { start } = useNavigationProgress();

  return (
    <div className="relative flex min-h-screen flex-col bg-white lg:flex-row">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">Sentinel</span>
          </div>
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800">Sign In</h1>
          <p className="mb-8 text-sm text-gray-500">
            AI-powered release command center for engineering teams
          </p>
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
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center bg-brand-950 lg:flex">
        <div className="max-w-md px-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/20">
            <Shield className="h-8 w-8 text-brand-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">Release with confidence</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            Sentinel brings together approvals, builds, dependencies, and AI agents in one
            command center — so you always know if it&apos;s safe to ship.
          </p>
        </div>
      </div>
    </div>
  );
}
