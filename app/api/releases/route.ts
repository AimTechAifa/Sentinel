import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const data = await prisma.release.findMany({
    include: {
      department: true,
      applications: { include: { application: true } },
      dependsOn: { include: { dependsOnRelease: true } },
    },
    orderBy: { releaseDate: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.release.create({
    data: {
      releaseCode: body.releaseCode,
      name: body.name,
      programProject: body.programProject ?? null,
      owner: body.owner,
      status: body.status ?? "Planned",
      releaseDate: new Date(body.releaseDate),
      priority: body.priority ?? "Medium",
      impact: body.impact ?? "Medium",
      departmentId: body.departmentId,
      notes: body.notes ?? null,
      applications: body.applicationIds?.length
        ? { create: body.applicationIds.map((id: string) => ({ applicationId: id })) }
        : undefined,
      dependsOn: body.dependsOnReleaseIds?.length
        ? { create: body.dependsOnReleaseIds.map((dependsOnReleaseId: string) => ({ dependsOnReleaseId })) }
        : undefined,
    },
    include: { department: true, applications: { include: { application: true } }, dependsOn: { include: { dependsOnRelease: true } } },
  });
  return NextResponse.json(row, { status: 201 });
}
