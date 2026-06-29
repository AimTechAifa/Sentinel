import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { checkSyncNowRateLimit } from "@/lib/connectors/rate-limit";
import { runConnectorById } from "@/lib/connector-engine";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { id } = await params;
  const connector = await prisma.connector.findUnique({ where: { id } });
  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  const limit = checkSyncNowRateLimit(id);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Please wait before syncing again",
        retryAfterSec: limit.retryAfterSec,
      },
      { status: 429 }
    );
  }

  await runConnectorById(id);
  const updated = await prisma.connector.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      lastSyncedAt: true,
      lastError: true,
    },
  });

  return NextResponse.json({
    ok: updated?.status === "CONNECTED",
    status: updated?.status,
    lastSyncedAt: updated?.lastSyncedAt,
    message:
      updated?.status === "ERROR"
        ? "Sync completed with errors. Check connector logs for details."
        : "Sync completed successfully.",
    lastError: updated?.lastError ?? null,
  });
}
