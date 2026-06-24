import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

type Period = "month" | "quarter" | "year";

function periodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "month") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    start.setMonth(q * 3, 1);
    end.setMonth(q * 3 + 3, 0);
  } else {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const period = (new URL(req.url).searchParams.get("period") ?? "month") as Period;
  const { start, end } = periodRange(period);

  const releases = await prisma.release.findMany({
    where: { releaseDate: { gte: start, lte: end } },
  });

  const counts = {
    planned: releases.filter((r) => r.status === "Planned" || r.status === "Scheduled").length,
    inProgress: releases.filter((r) => r.status === "In Progress" || r.status === "Ready").length,
    blocked: releases.filter((r) => r.status === "Blocked").length,
    atRisk: releases.filter((r) => r.status === "At Risk").length,
  };

  const connectors = await prisma.connectorSync.findMany({ orderBy: { name: "asc" } });
  const p1Issues = await prisma.p1Issue.findMany({ where: { priority: "P1" }, orderBy: { updatedAt: "desc" } });

  return NextResponse.json({ period, counts, connectors, p1Issues, range: { start, end } });
}
