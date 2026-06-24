import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { normalizeProgramProject } from "@/lib/release-id";

const releaseInclude = {
  department: true,
  applications: { include: { application: { include: { department: true } } } },
  dependsOn: { include: { dependsOnRelease: true } },
  dependedBy: { include: { release: true } },
  bookings: { include: { application: true, environment: true } },
  auditEvents: { orderBy: { createdAt: "desc" as const }, take: 50 },
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const row = await prisma.release.findUnique({
    where: { id: params.id },
    include: releaseInclude,
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireRole("editor");
  if (error) return error;

  const body = await req.json();
  const existing = await prisma.release.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  for (const key of ["name", "owner", "status", "priority", "impact", "notes", "decision", "departmentId", "releaseCode"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.programProject !== undefined) {
    data.programProject = normalizeProgramProject(body.programProject) ?? "N/A";
  }
  if (body.releaseDate) data.releaseDate = new Date(body.releaseDate);

  await prisma.release.update({ where: { id: params.id }, data });

  if (body.applicationIds) {
    await prisma.releaseApplication.deleteMany({ where: { releaseId: params.id } });
    if (body.applicationIds.length) {
      await prisma.releaseApplication.createMany({
        data: body.applicationIds.map((applicationId: string) => ({ releaseId: params.id, applicationId })),
      });
    }
  }

  if (body.dependsOnReleaseIds) {
    await prisma.releaseDependency.deleteMany({ where: { releaseId: params.id } });
    if (body.dependsOnReleaseIds.length) {
      await prisma.releaseDependency.createMany({
        data: body.dependsOnReleaseIds.map((dependsOnReleaseId: string) => ({
          releaseId: params.id,
          dependsOnReleaseId,
        })),
      });
    }
  }

  if (body.status && body.status !== existing.status) {
    await prisma.releaseAuditEvent.create({
      data: {
        releaseId: params.id,
        action: "status_change",
        actor: user!.name,
        detail: `Status changed to ${body.status}`,
      },
    });
  }

  const updated = await prisma.release.findUnique({ where: { id: params.id }, include: releaseInclude });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("editor");
  if (error) return error;
  await prisma.release.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
