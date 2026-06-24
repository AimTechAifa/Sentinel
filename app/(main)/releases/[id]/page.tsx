"use client";

import { DbReleaseDetail } from "@/components/releases/DbReleaseDetail";

export default function ReleaseDetailPage({ params }: { params: { id: string } }) {
  return <DbReleaseDetail id={params.id} />;
}
