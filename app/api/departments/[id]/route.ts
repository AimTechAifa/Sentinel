import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.department.update({
    where: { id: params.id },
    data: { name: body.name, head: body.head },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("editor");
  if (error) return error;
  await prisma.department.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
