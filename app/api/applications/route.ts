import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
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
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.application.create({
    data: {
      name: body.name,
      departmentId: body.departmentId,
      type: body.type ?? "",
      productOwner: body.productOwner ?? "",
      techLead: body.techLead ?? "",
      support: body.support ?? "",
      criticality: body.criticality ?? "Medium",
    },
    include: { department: true },
  });
  return NextResponse.json(row, { status: 201 });
}
