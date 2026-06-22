export type ApprovalGate = "QA" | "Security" | "Database" | "Business" | "Change";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";
export type BuildStatus = "Passed" | "Failed" | "Running" | "N/A";
export type ReleaseDecision = "Go" | "No-Go" | null;
export type ReleaseStatus = "Ready" | "At Risk" | "Blocked" | "Shipped" | "Scheduled";
export type ActivityType = "human" | "agent";
export type AgentRole =
  | "Ticket Agent"
  | "Build Agent"
  | "Approval Agent"
  | "Dependency Agent"
  | "Risk Agent"
  | "Summary Agent"
  | "Conversation Agent";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Done" | "Blocked";
  assignee: string;
}

export interface Approval {
  gate: ApprovalGate;
  status: ApprovalStatus;
  approver?: string;
  timestamp?: string;
  pendingSince?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  type: ActivityType;
  agent?: AgentRole;
}

export interface IncidentRecord {
  id: string;
  date: string;
  severity: "Sev-1" | "Sev-2" | "Sev-3";
  summary: string;
}

export interface Release {
  id: string;
  name: string;
  version: string;
  team: string;
  owner: string;
  targetDate: string;
  status: ReleaseStatus;
  decision: ReleaseDecision;
  filesChanged: number;
  typicalApprovalHours: Partial<Record<ApprovalGate, number>>;
  commits: Commit[];
  dependsOnServices: string[];
  incidentHistory: IncidentRecord[];
  tickets: Ticket[];
  approvals: Approval[];
  build: {
    id: string;
    status: BuildStatus;
    pipeline: string;
    lastRun: string;
    testCount: number;
    passedTests: number;
  };
  notes: string;
  history: HistoryEntry[];
}

export interface Service {
  id: string;
  name: string;
  dependsOn: string[];
  criticality: "Critical" | "High" | "Medium" | "Low";
  recentIncidents: IncidentRecord[];
  unstable?: boolean;
}

export interface Connector {
  id: string;
  name: string;
  description: string;
  status: "Connected" | "Disconnected" | "Error";
  lastSynced: string;
  maskedToken: string;
}

export interface AgentMeta {
  id: string;
  name: AgentRole;
  watches: string;
  description: string;
  status: "Active" | "Paused";
  lastRanMinutesAgo: number;
  sparkline: number[];
  sampleFindings: { text: string; releaseId?: string; timestamp: string }[];
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  type: ActivityType;
  actor: string;
  agent?: AgentRole;
  message: string;
  releaseId?: string;
}

export interface HistoricalTrendPoint {
  week: string;
  avgReadiness: number;
  rollbackCount: number;
}

export interface RiskFlag {
  title: string;
  explanation: string;
  severity: "low" | "medium" | "high";
  citations: string[];
}

export interface BuildExplanation {
  cause: string;
  suspectCommit: string;
  nextStep: string;
  citations: string[];
}

export interface DependencyWarning {
  warning: string;
  citations: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
}
