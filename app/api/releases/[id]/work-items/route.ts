import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { summarizeWorkItems } from "@/lib/dependency-impact";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("readonly");
  if (error) return error;

  const release = await prisma.release.findUnique({
    where: { id: id },
    select: { releaseCode: true },
  });
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [items, jiraSync] = await Promise.all([
    prisma.workItem.findMany({
      where: { releaseCode: release.releaseCode },
      orderBy: [{ itemType: "asc" }, { externalId: "asc" }],
    }),
    prisma.connectorSync.findUnique({ where: { name: "Jira" } }),
  ]);

  return NextResponse.json({
    releaseCode: release.releaseCode,
    items,
    summary: summarizeWorkItems(items),
    lastSynced: jiraSync?.lastSynced ?? null,
  });
}
