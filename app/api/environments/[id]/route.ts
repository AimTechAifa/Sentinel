import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.environment.update({
    where: { id: params.id },
    data: {
      applicationId: body.applicationId,
      name: body.name,
      type: body.type,
      owner: body.owner,
      lastDbRefresh: body.lastDbRefresh ? new Date(body.lastDbRefresh) : null,
      status: body.status,
    },
    include: { application: true },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("editor");
  if (error) return error;
  await prisma.environment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
