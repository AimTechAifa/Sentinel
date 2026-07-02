import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { validateCustomFields } from "@/lib/custom-fields";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();

  let customFields: Record<string, unknown> | undefined;
  if (body.customFields !== undefined) {
    const check = await validateCustomFields("Environment", user!.organizationId, body.customFields);
    if (!check.ok) return NextResponse.json({ error: "Invalid custom fields", details: check.errors }, { status: 400 });
    customFields = check.value;
  }

  const row = await prisma.environment.update({
    where: { id: id },
    data: {
      applicationId: body.applicationId,
      name: body.name,
      type: body.type,
      owner: body.owner,
      lastDbRefresh: body.lastDbRefresh ? new Date(body.lastDbRefresh) : null,
      status: body.status,
      ...(body.customFields !== undefined ? { customFields } : {}),
    },
    include: { application: true },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;
  await prisma.environment.delete({ where: { id: id } });
  return NextResponse.json({ ok: true });
}
