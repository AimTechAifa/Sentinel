import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { dbReleaseToSearchResult, demoReleaseMatchesQuery } from "@/lib/unified-releases";
import { releases as demoReleases } from "@/lib/dummy-data";
import type { SearchResult } from "@/lib/dummy-data";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const lower = q.toLowerCase();
  const results: SearchResult[] = [];

  const dbReleases = await prisma.release.findMany({
    where: {
      OR: [
        { releaseCode: { contains: q } },
        { name: { contains: q } },
        { owner: { contains: q } },
        { programProject: { contains: q } },
      ],
    },
    include: { department: true },
    take: 8,
  });
  dbReleases.forEach((r) => results.push(dbReleaseToSearchResult(r)));

  const apps = await prisma.application.findMany({
    where: { OR: [{ name: { contains: q } }, { type: { contains: q } }] },
    include: { department: true },
    take: 5,
  });
  apps.forEach((a) =>
    results.push({
      id: `db-app-${a.id}`,
      type: "release",
      label: a.name,
      sublabel: `${a.department.name} · Application · Database`,
      href: "/admin/reference-data",
    })
  );

  demoReleases
    .filter((r) => demoReleaseMatchesQuery(r, q))
    .slice(0, 8)
    .forEach((r) =>
      results.push({
        id: `demo-rel-${r.id}`,
        type: "release",
        label: `${r.version} — ${r.name}`,
        sublabel: `${r.team} · ${r.status} · Demo command center`,
        href: `/releases/${r.id}`,
      })
    );

  if (lower.includes("booking") || lower.includes("book env")) {
    results.push({
      id: "link-booking",
      type: "change",
      label: "Environment Booking",
      sublabel: "Check availability across applications",
      href: "/booking",
    });
  }

  if (lower.includes("mapping") || lower.includes("upstream") || lower.includes("downstream")) {
    results.push({
      id: "link-mapping",
      type: "change",
      label: "System Mapping",
      sublabel: "Env relationships and booking risks",
      href: "/system-mapping",
    });
  }

  const seen = new Set<string>();
  return NextResponse.json({
    results: results.filter((r) => {
      if (seen.has(r.href + r.label)) return false;
      seen.add(r.href + r.label);
      return true;
    }).slice(0, 14),
  });
}
