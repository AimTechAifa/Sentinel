import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { validateCustomFields } from "@/lib/custom-fields";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const data = await prisma.application.findMany({
    include: { department: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { user, error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();

  let customFields: Record<string, unknown> | undefined;
  if (body.customFields !== undefined) {
    const check = await validateCustomFields("Application", user!.organizationId, body.customFields);
    if (!check.ok) return NextResponse.json({ error: "Invalid custom fields", details: check.errors }, { status: 400 });
    customFields = check.value;
  }

  const row = await prisma.application.create({
    data: {
      organizationId: user!.organizationId,
      name: body.name,
      departmentId: body.departmentId,
      type: body.type ?? null,
      productOwner: body.productOwner ?? "",
      techLead: body.techLead ?? "",
      support: body.support ?? null,
      criticality: body.criticality ?? null,
      customFields,
    },
    include: { department: true },
  });
  return NextResponse.json(row, { status: 201 });
}
