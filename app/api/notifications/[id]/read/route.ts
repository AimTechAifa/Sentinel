import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { markNotificationRead } from "@/lib/release-state-repo";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  await markNotificationRead(params.id);
  return NextResponse.json({ ok: true });
}
