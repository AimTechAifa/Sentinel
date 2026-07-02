import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const data = await prisma.drift.findMany({
    include: {
      release: { select: { id: true, releaseCode: true, name: true, status: true } },
      application: { select: { id: true, name: true } },
    },
    orderBy: { detectedDate: "desc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const row = await prisma.drift.create({
    data: {
      organizationId: user!.organizationId,
      driftCode: body.driftCode,
      releaseId: body.releaseId,
      applicationId: body.applicationId,
      environmentName: body.environmentName,
      driftType: body.driftType,
      driftCategory: body.driftCategory ?? null,
      detectedDate: new Date(body.detectedDate),
      severity: body.severity,
      description: body.description,
      impactOnRelease: body.impactOnRelease ?? null,
      remediationAction: body.remediationAction ?? null,
      status: body.status ?? "Open",
      etaToFix: body.etaToFix ? new Date(body.etaToFix) : null,
    },
    include: {
      release: { select: { id: true, releaseCode: true, name: true } },
      application: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(row, { status: 201 });
}
