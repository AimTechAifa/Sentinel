import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { setRollbackNarrative } from "@/lib/release-state-repo";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const body = (await req.json()) as { narrative: string };
  await setRollbackNarrative(params.id, body.narrative);
  return NextResponse.json({ ok: true });
}
