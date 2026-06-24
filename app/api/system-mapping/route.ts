import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { prisma } from "@/lib/prisma";

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart <= bEnd && bStart <= aEnd;
}

export async function GET(req: Request) {
  const { error } = await requireRole("readonly");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const edges = await prisma.systemMappingEdge.findMany({
    include: {
      sourceApp: true,
      sourceEnv: true,
      targetApp: true,
      targetEnv: true,
    },
  });

  if (!from || !to) {
    return NextResponse.json({ edges, risks: [] });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const bookings = await prisma.envBooking.findMany({
    where: { status: "BOOKED" },
    include: { application: true, environment: true },
  });

  const risks = edges.flatMap((edge) => {
    const targetBooking = bookings.find(
      (b) =>
        b.applicationId === edge.targetAppId &&
        (!b.environmentId || b.environmentId === edge.targetEnvId) &&
        overlaps(fromDate, toDate, b.fromDate, b.toDate)
    );

    if (!targetBooking) return [];

    return [
      {
        edgeId: edge.id,
        source: `${edge.sourceApp.name} / ${edge.sourceEnv.name}`,
        target: `${edge.targetApp.name} / ${edge.targetEnv.name}`,
        notes: edge.notes,
        risk: `${edge.targetEnv.name} required by mapping is booked by ${targetBooking.bookedBy} (${targetBooking.team})`,
        bookedBy: targetBooking.bookedBy,
        team: targetBooking.team,
        fromDate: targetBooking.fromDate,
        toDate: targetBooking.toDate,
        purpose: targetBooking.purpose,
      },
    ];
  });

  return NextResponse.json({ edges, risks, period: { from, to } });
}

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;
  const body = await req.json();
  const row = await prisma.systemMappingEdge.create({
    data: {
      sourceAppId: body.sourceAppId,
      sourceEnvId: body.sourceEnvId,
      targetAppId: body.targetAppId,
      targetEnvId: body.targetEnvId,
      direction: body.direction ?? "downstream",
      notes: body.notes,
      isDefault: body.isDefault ?? true,
    },
    include: {
      sourceApp: true,
      sourceEnv: true,
      targetApp: true,
      targetEnv: true,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
