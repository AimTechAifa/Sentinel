import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { buildBookings, buildVersionMatrix } from "@/lib/db-environment-desk";
import {
  filterDemoReleasesForPeriod,
  parseReleaseFilters,
  prismaReleaseWhere,
} from "@/lib/db-release-filter";
import { releases as demoReleases } from "@/lib/dummy-data";
import { prisma } from "@/lib/prisma";
import { countByStatus, dbToUnified, demoToUnified, mergeReleases, periodRange, type Period } from "@/lib/unified-releases";

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const period = (new URL(req.url).searchParams.get("period") ?? "month") as Period;
  const filters = parseReleaseFilters(req);
  const { start, end } = periodRange(period);

  const [departments, applications, environments] = await Promise.all([
    prisma.department.findMany(),
    prisma.application.findMany(),
    prisma.environment.findMany({ include: { application: true } }),
  ]);

  const dbWhere = prismaReleaseWhere(filters, {
    releaseDate: { gte: start, lte: end },
  });

  const appFilter = filters.applicationId
    ? applications.find((a) => a.id === filters.applicationId)
    : null;

  const [dbReleases, bookings, apps, versions, connectors, p1Issues] = await Promise.all([
    prisma.release.findMany({
      where: dbWhere,
      include: { department: true },
      orderBy: { releaseDate: "asc" },
    }),
    prisma.envBooking.findMany({ include: { application: true }, orderBy: { fromDate: "asc" }, take: 8 }),
    prisma.application.findMany({ include: { department: true, environments: true } }),
    prisma.environmentVersion.findMany({ include: { environment: true, application: { include: { department: true } } } }),
    prisma.connectorSync.findMany({ orderBy: { name: "asc" } }),
    prisma.p1Issue.findMany({
      where: {
        priority: "P1",
        ...(appFilter ? { application: appFilter.name } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const demoFiltered = filterDemoReleasesForPeriod(
    period,
    filters,
    departments,
    applications,
    environments
  );
  const demoInPeriod = demoFiltered.map(demoToUnified);

  const dbUnified = dbReleases.map(dbToUnified);
  const combined = mergeReleases(dbUnified, demoInPeriod);
  const combinedCounts = countByStatus(combined);
  const demoCounts = countByStatus(demoInPeriod);
  const dbCounts = countByStatus(dbUnified);
  const versionMatrix = buildVersionMatrix(apps, versions, dbReleases);
  const driftApps = versionMatrix.filter((v) => v.drift).length;

  return NextResponse.json({
    period,
    range: { start, end },
    counts: {
      combined: combinedCounts,
      database: dbCounts,
      demo: demoCounts,
    },
    releases: combined.slice(0, 20),
    bookings: buildBookings(bookings),
    connectors,
    p1Issues,
    environment: {
      driftApps,
      bookedEnvs: bookings.length,
      applications: apps.length,
    },
    demoPortfolio: {
      totalDemoReleases: demoReleases.length,
      inPeriod: demoInPeriod.length,
      atRisk: demoCounts.atRisk,
      blocked: demoCounts.blocked,
    },
    links: [
      { label: "All releases", href: "/releases?view=all" },
      { label: "Database releases", href: "/releases?view=database" },
      { label: "Demo command center", href: "/releases?view=demo" },
      { label: "Quick Start scenarios", href: "/templates" },
      { label: "Environment desk", href: "/environments" },
      { label: "Env booking", href: "/booking" },
      { label: "System mapping", href: "/system-mapping" },
    ],
  });
}
