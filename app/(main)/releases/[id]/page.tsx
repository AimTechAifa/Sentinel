"use client";

import { useEffect, useState } from "react";
import { DbReleaseDetail } from "@/components/releases/DbReleaseDetail";
import { isSyntheticReleaseId, SyntheticReleaseDetail } from "@/components/releases/SyntheticReleaseDetail";

export default function ReleaseDetailPage({ params }: { params: { id: string } }) {
  const [mode, setMode] = useState<"loading" | "db" | "synthetic" | "missing">("loading");

  useEffect(() => {
    if (isSyntheticReleaseId(params.id)) {
      setMode("synthetic");
      return;
    }
    fetch(`/api/releases/${params.id}`)
      .then((r) => setMode(r.ok ? "db" : "missing"))
      .catch(() => setMode("missing"));
  }, [params.id]);

  if (mode === "loading") return <p className="text-gray-500">Loading release…</p>;
  if (mode === "missing") return <p className="text-gray-500">Release not found.</p>;
  if (mode === "synthetic") return <SyntheticReleaseDetail id={params.id} />;
  return <DbReleaseDetail id={params.id} />;
}
