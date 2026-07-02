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
    const check = await validateCustomFields("Application", user!.organizationId, body.customFields);
    if (!check.ok) return NextResponse.json({ error: "Invalid custom fields", details: check.errors }, { status: 400 });
    customFields = check.value;
  }

  const row = await prisma.application.update({
    where: { id: id },
    data: {
      name: body.name,
      departmentId: body.departmentId,
      type: body.type,
      productOwner: body.productOwner,
      techLead: body.techLead,
      support: body.support,
      criticality: body.criticality,
      customFields,
    },
    include: { department: true },
  });
  return NextResponse.json(row);
}

// Soft delete — the Prisma middleware converts this into deletedAt = now(),
// leaving Risk/Approval/Drift/EnvBooking history intact.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await requireRole("editor");
  if (error) return error;
  await prisma.application.delete({ where: { id: id } });
  return NextResponse.json({ ok: true });
}
