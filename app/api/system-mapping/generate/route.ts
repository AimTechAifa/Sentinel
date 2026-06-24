import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api";
import { completeChat } from "@/lib/llm";
import {
  parseNotesToMappingEdges,
  resolveMappingEdge,
  type SuggestedMappingEdge,
} from "@/lib/mapping-from-notes";
import { prisma } from "@/lib/prisma";

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

  let suggestions: SuggestedMappingEdge[] = parseNotesToMappingEdges(notes, apps);
  let usedAi = false;

  const hasLlm = !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  if (!suggestions.length && hasLlm) {
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
        timeoutMs: 12_000,
      });
      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()) as SuggestedMappingEdge[];
      if (Array.isArray(parsed) && parsed.length) {
        suggestions = parsed;
        usedAi = true;
      }
    } catch {
      // keep empty suggestions
    }
  }

  const created = [];
  const skipped: string[] = [];

  for (const s of suggestions) {
    const resolved = resolveMappingEdge(s, apps);
    if (!resolved) {
      skipped.push(`${s.sourceApp}/${s.sourceEnv} → ${s.targetApp}/${s.targetEnv}`);
      continue;
    }

    const duplicate = await prisma.systemMappingEdge.findFirst({
      where: {
        sourceAppId: resolved.sourceAppId,
        sourceEnvId: resolved.sourceEnvId,
        targetAppId: resolved.targetAppId,
        targetEnvId: resolved.targetEnvId,
      },
    });
    if (duplicate) {
      skipped.push(`${s.sourceApp}/${s.sourceEnv} → ${s.targetApp}/${s.targetEnv} (already exists)`);
      continue;
    }

    const row = await prisma.systemMappingEdge.create({
      data: {
        sourceAppId: resolved.sourceAppId,
        sourceEnvId: resolved.sourceEnvId,
        targetAppId: resolved.targetAppId,
        targetEnvId: resolved.targetEnvId,
        direction: s.direction ?? "downstream",
        notes: s.notes ?? notes.slice(0, 240),
        isDefault: false,
      },
      include: { sourceApp: true, sourceEnv: true, targetApp: true, targetEnv: true },
    });
    created.push(row);
  }

  if (!created.length && !suggestions.length) {
    return NextResponse.json(
      {
        error:
          "Could not match applications in your notes. Use names from reference data (SAP, FIN, CRM, Oracle) and env types like Dev, Test, or UAT.",
        created: [],
        suggestions: [],
        skipped,
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    created,
    suggestions,
    skipped,
    usedAi,
    message:
      created.length > 0
        ? `Added ${created.length} mapping edge${created.length === 1 ? "" : "s"}${usedAi ? " (AI)" : " (from notes)"}.`
        : "No new edges added — matching mappings may already exist.",
  });
}
