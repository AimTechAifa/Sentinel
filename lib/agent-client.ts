"use client";

import type { AgentRole, BuildExplanation, DependencyWarning, RiskFlag } from "./types";

interface AgentRequest {
  agentRole: AgentRole;
  context: object;
  userMessage?: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  mode?: "structured" | "line" | "prose";
}

interface AgentResponse {
  text?: string;
  flags?: RiskFlag[];
  build?: BuildExplanation;
  warnings?: DependencyWarning[];
  error?: string;
}

export async function callAgent(req: AgentRequest): Promise<AgentResponse> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    return { error: err.error ?? "AI unavailable" };
  }
  return res.json();
}
