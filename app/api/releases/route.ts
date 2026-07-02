import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { validateCustomFields } from "@/lib/custom-fields";
import { prisma } from "@/lib/prisma";
import { generateReleaseId, normalizeProgramProject } from "@/lib/release-id";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const data = await prisma.release.findMany({
    include: {
      department: true,
      releaseOwner: { select: { id: true, userId: true, name: true, email: true } },
      applications: { include: { application: true } },
      dependsOn: { include: { dependsOnRelease: true } },
      stakeholders: { include: { user: true } },
    },
    orderBy: { releaseDate: "asc" },
  });
  // Keep a derived `owner` string for UI compatibility with the old schema.
  return NextResponse.json(data.map((r) => ({ ...r, owner: r.releaseOwner?.name ?? "Unassigned" })));
}

export async function POST(req: Request) {
  const { user, error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();

  const existing = await prisma.release.findMany({ select: { releaseCode: true } });
  const releaseCode =
    body.releaseCode?.trim() ||
    generateReleaseId(existing.map((r) => r.releaseCode));

  // Release.owner (flat string) was removed — resolve the owner to a User
  // relation (releaseOwnerId) by id or name.
  let releaseOwnerId: string | undefined = body.releaseOwnerId;
  if (!releaseOwnerId && body.owner) {
    const ownerUser = await prisma.user.findFirst({
      where: { name: { equals: String(body.owner), mode: "insensitive" } },
      select: { id: true },
    });
    releaseOwnerId = ownerUser?.id;
  }

  let customFields: Record<string, unknown> | undefined;
  if (body.customFields !== undefined) {
    const check = await validateCustomFields("Release", user!.organizationId, body.customFields);
    if (!check.ok) return NextResponse.json({ error: "Invalid custom fields", details: check.errors }, { status: 400 });
    customFields = check.value;
  }

  const row = await prisma.release.create({
    data: {
      organizationId: user!.organizationId,
      releaseCode,
      name: body.name,
      programProject: normalizeProgramProject(body.programProject ?? "") ?? "N/A",
      releaseOwnerId,
      status: body.status ?? "Planned",
      releaseDate: new Date(body.releaseDate),
      priority: body.priority ?? "Medium",
      impact: body.impact ?? "Medium",
      departmentId: body.departmentId,
      notes: body.notes ?? null,
      customFields,
      applications: body.applicationIds?.length
        ? { create: body.applicationIds.map((id: string) => ({ applicationId: id })) }
        : undefined,
      dependsOn: body.dependsOnReleaseIds?.length
        ? { create: body.dependsOnReleaseIds.map((dependsOnReleaseId: string) => ({ dependsOnReleaseId })) }
        : undefined,
    },
    include: { department: true, applications: { include: { application: true } }, dependsOn: { include: { dependsOnRelease: true } }, stakeholders: { include: { user: true } } },
  });
  return NextResponse.json(row, { status: 201 });
}
