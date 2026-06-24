import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { setAgentPaused } from "@/lib/release-state-repo";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const body = (await req.json()) as { paused: boolean };
  await setAgentPaused(params.id, body.paused);
  return NextResponse.json({ ok: true });
}
