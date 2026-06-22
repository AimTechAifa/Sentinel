import { AlertTriangle } from "lucide-react";
import { getBlockers } from "@/lib/utils";
import type { Release } from "@/lib/types";

export function BlockerList({ release }: { release: Release }) {
  const blockers = getBlockers(release);
  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <h3 className="font-semibold text-slate-900 mb-4">Blockers</h3>
      {blockers.length === 0 ? (
        <p className="text-sm text-emerald-600">No blockers — release looks clear.</p>
      ) : (
        <ul className="space-y-2">
          {blockers.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
