import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { completeChat } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

type SuggestedEdge = {
  sourceApp: string;
  sourceEnv: string;
  targetApp: string;
  targetEnv: string;
  direction?: string;
  notes?: string;
};

export async function POST(req: Request) {
  const { error } = await requireRole("editor");
  if (error) return error;

  const { notes } = (await req.json()) as { notes?: string };
  if (!notes?.trim()) {
    return NextResponse.json({ error: "notes required" }, { status: 400 });
  }

  const apps = await prisma.application.findMany({ include: { environments: true, department: true } });
  const catalog = apps.map((a) => ({
    app: a.name,
    department: a.department.name,
    envs: a.environments.map((e) => ({ name: e.name, type: e.type, id: e.id })),
    appId: a.id,
  }));

  let suggestions: SuggestedEdge[] = [];

  try {
    const { text: raw } = await completeChat({
      system: "You are a release desk system mapping assistant. Output ONLY a valid JSON array, no markdown.",
      messages: [
        {
          role: "user",
          content: `Given user notes, output a JSON array of mapping edges.
Each edge: { "sourceApp", "sourceEnv", "targetApp", "targetEnv", "direction": "downstream"|"upstream", "notes" }
Use only application and environment names from this catalog:
${JSON.stringify(catalog, null, 2)}

User notes:
${notes}`,
        },
      ],
    });
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()) as SuggestedEdge[];
    if (Array.isArray(parsed)) suggestions = parsed;
  } catch {
    suggestions = heuristicFromNotes(notes, apps);
  }

  const created = [];
  for (const s of suggestions) {
    const sourceApp = apps.find((a) => a.name.toLowerCase() === s.sourceApp.toLowerCase());
    const targetApp = apps.find((a) => a.name.toLowerCase() === s.targetApp.toLowerCase());
    if (!sourceApp || !targetApp) continue;
    const sourceEnv = sourceApp.environments.find((e) => e.name.toLowerCase().includes(s.sourceEnv.toLowerCase()) || e.type.toLowerCase() === s.sourceEnv.toLowerCase());
    const targetEnv = targetApp.environments.find((e) => e.name.toLowerCase().includes(s.targetEnv.toLowerCase()) || e.type.toLowerCase() === s.targetEnv.toLowerCase());
    if (!sourceEnv || !targetEnv) continue;

    const row = await prisma.systemMappingEdge.create({
      data: {
        sourceAppId: sourceApp.id,
        sourceEnvId: sourceEnv.id,
        targetAppId: targetApp.id,
        targetEnvId: targetEnv.id,
        direction: s.direction ?? "downstream",
        notes: s.notes ?? notes.slice(0, 240),
        isDefault: false,
      },
      include: { sourceApp: true, sourceEnv: true, targetApp: true, targetEnv: true },
    });
    created.push(row);
  }

  return NextResponse.json({ created, suggestions });
}

function heuristicFromNotes(
  notes: string,
  apps: { id: string; name: string; environments: { id: string; name: string; type: string }[] }[]
) {
  const lower = notes.toLowerCase();
  const mentioned = apps.filter((a) => lower.includes(a.name.toLowerCase()));
  if (mentioned.length < 2) return [];
  const [sourceApp, targetApp] = mentioned;
  return [
    {
      sourceApp: sourceApp.name,
      sourceEnv: sourceApp.environments[0]?.name ?? "Dev",
      targetApp: targetApp.name,
      targetEnv: targetApp.environments[0]?.name ?? "Dev",
      direction: "downstream",
      notes,
    },
  ];
}
