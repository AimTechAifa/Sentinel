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
  | "Conversation Agent"
  | "Comms Agent"
  | "CAB Agent"
  | "Deploy Agent"
  | "Security Agent"
  | "SLO Agent"
  | "Runbook Agent";

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

export type ChangeRiskTier = "Low" | "Medium" | "High" | "Critical";
export type CabVoteStatus = "Pending" | "Approved" | "Deferred" | "Rejected";

export interface ChangeRecord {
  crNumber: string;
  riskTier: ChangeRiskTier;
  scheduledStart: string;
  scheduledEnd: string;
  backoutPlan: string;
  affectedServices: string[];
  description: string;
  cabStatus: CabVoteStatus;
  cabSessionDate: string;
  submittedBy: string;
}

export interface CabSession {
  id: string;
  title: string;
  date: string;
  releaseIds: string[];
  chair: string;
  status: "Scheduled" | "In Progress" | "Completed";
}

export interface FreezeWindow {
  id: string;
  name: string;
  start: string;
  end: string;
  reason: string;
}

export type DeploymentPhase =
  | "Not Started"
  | "Scheduled"
  | "In Progress"
  | "Verifying"
  | "Verified"
  | "Rolled Back"
  | "Failed";

export type LifecycleStageId =
  | "planning"
  | "scheduling"
  | "testing"
  | "preparing"
  | "managing"
  | "deployment";

export type StageStatus = "complete" | "active" | "pending" | "blocked";

export interface LifecycleStageView {
  id: LifecycleStageId;
  label: string;
  status: StageStatus;
  detail: string;
}

export interface DeploymentSmokeTest {
  id: string;
  name: string;
  status: "Pending" | "Running" | "Passed" | "Failed";
}

export interface LiveMetricSnapshot {
  id: string;
  label: string;
  value: number;
  unit: string;
  threshold: number;
  status: "healthy" | "warning" | "critical";
}

export interface ReleaseDeploymentConfig {
  environment: string;
  cluster: string;
  pipeline: string;
  targetNamespace: string;
}

export interface DeploymentLiveState {
  phase: DeploymentPhase;
  rolloutPct: number;
  smokeTests: DeploymentSmokeTest[];
  metrics: LiveMetricSnapshot[];
  startedAt?: string;
  completedAt?: string;
  autoRollback?: boolean;
  rollbackReason?: string;
  rollbackNarrative?: string;
}

export type EnvironmentStage = "dev" | "staging" | "prod";
export type RegionCode = "us-east-1" | "eu-west-1" | "ap-southeast-2";

export interface EnvironmentPromotion {
  environment: EnvironmentStage;
  region: RegionCode;
  version: string;
  status: "live" | "deploying" | "pending" | "failed" | "rolled-back";
  deployedAt?: string;
}

export interface ReleaseDecisionRecord {
  decision: ReleaseDecision;
  rationale?: string;
  decidedAt: string;
  decidedBy: string;
  overridden?: boolean;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  releaseId?: string;
  read: boolean;
  type: "approval" | "build" | "cab" | "comms" | "decision";
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
  changeRecord?: ChangeRecord;
  deployment?: ReleaseDeploymentConfig;
  environmentPromotions?: EnvironmentPromotion[];
}

export interface Service {
  id: string;
  name: string;
  dependsOn: string[];
  criticality: "Critical" | "High" | "Medium" | "Low";
  recentIncidents: IncidentRecord[];
  unstable?: boolean;
}

export type ConnectorCategory =
  | "Issue Tracking"
  | "Source Control"
  | "CI/CD"
  | "Change Management"
  | "Monitoring"
  | "Incident"
  | "Security"
  | "Documentation"
  | "Communication"
  | "Deployment"
  | "Artifact Registry"
  | "Feature Flags"
  | "Secrets & Config";

export interface Connector {
  id: string;
  name: string;
  category: ConnectorCategory;
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
  tagline: string;
  accent: string;
  status: "Active" | "Paused";
  lastRanMinutesAgo: number;
  sparkline: number[];
  liveAi: boolean;
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

export type KgNodeType = "release" | "service" | "person" | "ticket" | "change" | "incident";

export interface KgNode {
  id: string;
  type: KgNodeType;
  label: string;
  sublabel?: string;
  href?: string;
  meta?: Record<string, string>;
}

export interface KgEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ReleasePrediction {
  releaseId: string;
  version: string;
  team: string;
  targetDate: string;
  shipSuccessPct: number;
  rollbackRiskPct: number;
  delayRiskPct: number;
  confidence: number;
  factors: { label: string; impact: number; direction: "up" | "down" }[];
  modelVersion: string;
}

export interface TeamRiskCell {
  team: string;
  riskScore: number;
  active: number;
  atRisk: number;
  blocked: number;
  avgReadiness: number;
}

export interface ForecastTrendPoint {
  week: string;
  actualReadiness?: number;
  predictedReadiness?: number;
  predictedRollbacks?: number;
  isForecast?: boolean;
}
