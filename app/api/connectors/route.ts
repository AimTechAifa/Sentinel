import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireRole("readonly");
  if (error) return error;
  const rows = await prisma.connectorSync.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { name } = (await req.json()) as { name?: string };
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const row = await prisma.connectorSync.update({
    where: { name },
    data: { lastSynced: new Date() },
  });
  return NextResponse.json(row);
}
