import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { stripCredentials } from "@/lib/connectors/public";
import { encryptCredentials } from "@/lib/connector-engine";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    baseUrl?: string | null;
    credentials?: Record<string, string>;
    config?: Record<string, unknown>;
    pollInterval?: number;
    enabled?: boolean;
  };

  const existing = await prisma.connector.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name.trim();
  if (body.baseUrl !== undefined) data.baseUrl = body.baseUrl;
  if (body.config != null) data.config = body.config;
  if (body.pollInterval != null) data.pollInterval = body.pollInterval;
  if (body.enabled != null) {
    data.enabled = body.enabled;
    data.status = body.enabled ? (existing.status === "DISABLED" ? "PENDING" : existing.status) : "DISABLED";
  }
  if (body.credentials && Object.keys(body.credentials).length > 0) {
    data.credentials = encryptCredentials(body.credentials);
  }

  const row = await prisma.connector.update({ where: { id }, data });
  return NextResponse.json(stripCredentials(row));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.connector.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  await prisma.connector.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
