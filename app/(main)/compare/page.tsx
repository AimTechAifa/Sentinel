"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ReleaseCompareView } from "@/components/releases/ReleaseCompareView";
import { releases, services } from "@/lib/dummy-data";
import {
  buildCompareSnapshot,
  COMPARE_PRESETS,
} from "@/lib/release-comparison";
import { predictAllReleases } from "@/lib/predictive";
import { Columns2 } from "lucide-react";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const leftParam = searchParams.get("left");
  const rightParam = searchParams.get("right");

  const [leftId, setLeftId] = useState("rel-v2140");
  const [rightId, setRightId] = useState("rel-v2141");

  useEffect(() => {
    if (leftParam && releases.some((r) => r.id === leftParam)) {
      setLeftId(leftParam);
    }
    if (rightParam && releases.some((r) => r.id === rightParam)) {
      setRightId(rightParam);
    }
  }, [leftParam, rightParam]);

  const unstableIds = useMemo(() => services.filter((s) => s.unstable).map((s) => s.id), []);
  const predictions = useMemo(() => predictAllReleases(releases, unstableIds), [unstableIds]);
  const predMap = useMemo(() => new Map(predictions.map((p) => [p.releaseId, p])), [predictions]);

  const leftRelease = releases.find((r) => r.id === leftId);
  const rightRelease = releases.find((r) => r.id === rightId);

  const leftSnap = leftRelease ? buildCompareSnapshot(leftRelease, predMap.get(leftId)) : null;
  const rightSnap = rightRelease ? buildCompareSnapshot(rightRelease, predMap.get(rightId)) : null;

  const activeReleases = releases.filter((r) => r.status !== "Shipped");

  return (
    <div className="space-y-6">
      <TopBar
        title="Release Comparison"
        subtitle="Side-by-side readiness, blockers, and ML forecasts — good vs bad"
        highlight
      />

      <div className="flex flex-wrap gap-2">
        {COMPARE_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setLeftId(p.leftId);
              setRightId(p.rightId);
            }}
            className="text-xs rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-gray-200/80 bg-white/60 p-4 backdrop-blur-sm">
        <label className="text-sm">
          <span className="text-gray-500 block mb-1">Left release</span>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            {activeReleases.map((r) => (
              <option key={r.id} value={r.id}>{r.version} — {r.name} ({r.status})</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-gray-500 block mb-1">Right release</span>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            {activeReleases.map((r) => (
              <option key={r.id} value={r.id}>{r.version} — {r.name} ({r.status})</option>
            ))}
          </select>
        </label>
      </div>

      {leftSnap && rightSnap ? (
        <ReleaseCompareView left={leftSnap} right={rightSnap} />
      ) : (
        <p className="text-gray-500">Select two releases to compare.</p>
      )}

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <Columns2 className="w-3.5 h-3.5" />
        Default preset: v2.14.0 (at risk) vs v2.14.1 (all green)
      </p>
    </div>
  );
}
