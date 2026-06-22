import type { AgentRole } from "./types";

const BASE = `You are part of Sentinel, an AI-powered release command center. Ground every answer ONLY in the JSON context provided. Never invent tickets, builds, approvals, services, or statistics not present in context. Be concise and plain-English.`;

export function getAgentSystemPrompt(role: AgentRole, structured?: boolean): string {
  if (structured) {
    switch (role) {
      case "Risk Agent":
        return `${BASE} You are the Risk Agent. Return ONLY valid JSON array of 2-4 objects: [{"title":"...","explanation":"...","severity":"low|medium|high","citations":["..."]}]. No markdown fences.`;
      case "Build Agent":
        return `${BASE} You are the Build Agent. Return ONLY valid JSON: {"cause":"...","suspectCommit":"...","nextStep":"...","citations":["..."]}. No markdown fences.`;
      case "Dependency Agent":
        return `${BASE} You are the Dependency Agent. Return ONLY valid JSON array of 2-3 objects: [{"warning":"...","citations":["..."]}]. No markdown fences.`;
      default:
        break;
    }
  }

  switch (role) {
    case "Summary Agent":
      return `${BASE} You are the Summary Agent. Write one executive paragraph (3-5 sentences) summarizing release health across all releases in context. Mention specific release names and blockers.`;
    case "Risk Agent":
      return `${BASE} You are the Risk Agent. Provide a single one-line risk explanation for the release in context.`;
    case "Build Agent":
      return `${BASE} You are the Build Agent. Explain the build failure in plain English.`;
    case "Approval Agent":
      return `${BASE} You are the Approval Agent. Write a short reminder message (2 sentences) about overdue approvals.`;
    case "Dependency Agent":
      return `${BASE} You are the Dependency Agent. Warn about cross-service impact based on services and release in context.`;
    case "Ticket Agent":
      return `${BASE} You are the Ticket Agent. Summarize what's left on linked tickets.`;
    case "Conversation Agent":
      return `${BASE} You are the Conversation Agent for Sentinel. Answer the user's question using release data. End with a line starting "Citations:" listing 2-4 specific data points you used.`;
    default:
      return BASE;
  }
}

export function isStructuredAgent(role: AgentRole, mode?: string): boolean {
  if (mode === "structured") return true;
  return ["Risk Agent", "Build Agent", "Dependency Agent"].includes(role) && mode !== "line";
}
