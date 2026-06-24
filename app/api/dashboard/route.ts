import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prismaReleaseWhere, parseReleaseFilters } from "@/lib/db-release-filter";
import { prisma } from "@/lib/prisma";
import { periodRange, type Period } from "@/lib/period-range";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const url = new URL(req.url);
  const period = (url.searchParams.get("period") ?? "month") as Period;
  const filters = parseReleaseFilters(req);
  const { start, end } = periodRange(period);

  const where = prismaReleaseWhere(filters, {
    releaseDate: { gte: start, lte: end },
  });

  const releases = await prisma.release.findMany({ where });

  const counts = {
    planned: releases.filter((r) => r.status === "Planned" || r.status === "Scheduled").length,
    inProgress: releases.filter((r) => r.status === "In Progress" || r.status === "Ready").length,
    blocked: releases.filter((r) => r.status === "Blocked").length,
    atRisk: releases.filter((r) => r.status === "At Risk").length,
    shipped: releases.filter((r) => r.status === "Shipped" || r.status === "Complete").length,
  };

  const p1Where: { priority: string; application?: string } = { priority: "P1" };
  if (filters.applicationId) {
    const app = await prisma.application.findUnique({ where: { id: filters.applicationId } });
    if (app) p1Where.application = app.name;
  }

  const [connectors, p1Issues] = await Promise.all([
    prisma.connectorSync.findMany({ orderBy: { name: "asc" } }),
    prisma.p1Issue.findMany({ where: p1Where, orderBy: { updatedAt: "desc" } }),
  ]);

  return NextResponse.json({ period, counts, connectors, p1Issues, range: { start, end } });
}
