import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";
import { decryptCredentials, testConnectorConnection } from "@/lib/connector-engine";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { id } = await params;
  const connector = await prisma.connector.findUnique({ where: { id } });
  if (!connector) {
    return NextResponse.json({ error: "Connector not found" }, { status: 404 });
  }

  let credentials: Record<string, string>;
  try {
    credentials = decryptCredentials(connector.credentials) as Record<string, string>;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Stored credentials could not be read. Try updating credentials." },
      { status: 400 }
    );
  }

  const result = await testConnectorConnection({
    type: connector.type,
    authType: connector.authType,
    baseUrl: connector.baseUrl,
    credentials,
    config: (connector.config as Record<string, unknown>) ?? {},
  });

  return NextResponse.json(result);
}
