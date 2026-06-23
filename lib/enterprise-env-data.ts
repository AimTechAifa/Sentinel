import type {
  ApplicationConfig,
  ApplicationEnvConfig,
  ApplicationVersionRow,
  EnterpriseReleaseImpact,
  EnterpriseSystemNode,
  EnvBooking,
  ReleaseTimelineEntry,
} from "./types";

const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export const releaseTimeline: ReleaseTimelineEntry[] = [
  {
    id: "tl-fin-sit1",
    name: "FIN SIT 1",
    department: "FIN",
    size: "high",
    impact: "high",
    startDate: daysFromNow(14),
    endDate: daysFromNow(28),
    status: "Scheduled",
  },
  {
    id: "tl-fin-sit2",
    name: "FIN SIT 2",
    department: "FIN",
    size: "high",
    impact: "medium",
    startDate: daysFromNow(45),
    endDate: daysFromNow(59),
    status: "Scheduled",
  },
  {
    id: "tl-fin-uat",
    name: "FIN UAT",
    department: "FIN",
    size: "medium",
    impact: "high",
    startDate: daysFromNow(75),
    endDate: daysFromNow(89),
    status: "Scheduled",
  },
  {
    id: "tl-hr-core",
    name: "HR Core Upgrade",
    department: "HR",
    size: "medium",
    impact: "medium",
    startDate: daysFromNow(7),
    endDate: daysFromNow(21),
    status: "At Risk",
  },
  {
    id: "tl-sec-patch",
    name: "Security Patch Window",
    department: "Security",
    size: "low",
    impact: "high",
    startDate: daysFromNow(3),
    endDate: daysFromNow(5),
    status: "Ready",
  },
  {
    id: "tl-crm-rollout",
    name: "CRM v4 Rollout",
    department: "CRM",
    size: "high",
    impact: "medium",
    startDate: daysFromNow(30),
    endDate: daysFromNow(44),
    status: "Scheduled",
  },
  {
    id: "tl-plat-infra",
    name: "Platform Infra Refresh",
    department: "Platform",
    size: "medium",
    impact: "low",
    startDate: daysFromNow(60),
    endDate: daysFromNow(74),
    status: "Scheduled",
  },
  {
    id: "tl-ops-dr",
    name: "DR Failover Test",
    department: "Operations",
    size: "low",
    impact: "medium",
    startDate: daysFromNow(20),
    endDate: daysFromNow(22),
    status: "Ready",
  },
];

export const envBookings: EnvBooking[] = [
  { id: "bk-sap-jun", system: "SAP", month: "JUNE", status: "IDLE" },
  {
    id: "bk-sap-jul",
    system: "SAP",
    month: "JULY",
    status: "BOOKED",
    team: "FIN",
    purpose: "SIT 1",
    contact: "Guru",
  },
  {
    id: "bk-sap-aug",
    system: "SAP",
    month: "AUG",
    status: "BOOKED",
    team: "FIN",
    purpose: "SIT 2",
    contact: "Guru",
  },
  {
    id: "bk-sap-sep",
    system: "SAP",
    month: "SEP",
    status: "BOOKED",
    team: "FIN",
    purpose: "UAT",
    contact: "Guru",
  },
  { id: "bk-sap-oct", system: "SAP", month: "OCT", status: "IDLE" },
  { id: "bk-oracle-jun", system: "Oracle", month: "JUNE", status: "BOOKED", team: "Platform", purpose: "Dev refresh", contact: "Alex Kim" },
  { id: "bk-oracle-jul", system: "Oracle", month: "JULY", status: "IDLE" },
  { id: "bk-oracle-aug", system: "Oracle", month: "AUG", status: "MAINTENANCE", team: "Platform", purpose: "Patch cycle", contact: "Alex Kim" },
];

export const enterpriseSystemNodes: EnterpriseSystemNode[] = [
  { id: "test-sap", label: "TEST SAP", type: "environment" },
  { id: "uat-asset", label: "UAT Asset Mgmt", type: "environment", parentId: "test-sap" },
  { id: "dev-oracle", label: "DEV Oracle", type: "environment", parentId: "test-sap" },
  { id: "prod-sap", label: "PROD SAP", type: "environment" },
  { id: "prod-oracle", label: "PROD Oracle", type: "environment", parentId: "prod-sap" },
  { id: "app-fin", label: "FIN Application", type: "application", parentId: "uat-asset" },
  { id: "app-crm", label: "CRM Application", type: "application", parentId: "dev-oracle" },
];

export const applicationVersions: ApplicationVersionRow[] = [
  { application: "SAP", dev: "V2.0", test: "V2.0", prod: "V1.0" },
  { application: "FIN", dev: "V3.31", test: "V3.2", prod: "V3.0" },
  { application: "CRM", dev: "V4.0", test: "V3.2.1", prod: "V3.0" },
];

export const applicationEnvConfigs: ApplicationEnvConfig[] = [
  {
    application: "SAP",
    environment: "DEV",
    infra: "AWS ap-southeast-2 · t3.xlarge × 4",
    firewall: "Allow 443 inbound from corp VPN",
    networkZone: "DMZ-Dev",
    lastUpdated: daysAgo(2),
  },
  {
    application: "SAP",
    environment: "TEST",
    infra: "On-prem ESXi cluster · 8 vCPU / 32 GB",
    firewall: "Restricted — test subnet only",
    networkZone: "Internal-Test",
    lastUpdated: daysAgo(1),
  },
  {
    application: "SAP",
    environment: "PROD",
    infra: "On-prem HA pair · 16 vCPU / 64 GB",
    firewall: "Deny all except approved CIDRs",
    networkZone: "Production",
    lastUpdated: daysAgo(0.5),
  },
  {
    application: "FIN",
    environment: "DEV",
    infra: "Azure AKS · 3 nodes",
    firewall: "Open to dev team subnets",
    networkZone: "DMZ-Dev",
    lastUpdated: daysAgo(3),
  },
  {
    application: "FIN",
    environment: "UAT",
    infra: "Azure AKS · 5 nodes",
    firewall: "Business UAT sign-off required",
    networkZone: "Internal-UAT",
    lastUpdated: daysAgo(1),
  },
  {
    application: "CRM",
    environment: "DEV",
    infra: "GCP GKE · autopilot",
    firewall: "Allow 443 from CI runners",
    networkZone: "DMZ-Dev",
    lastUpdated: daysAgo(4),
  },
];

export const applicationConfigs: ApplicationConfig[] = [
  {
    application: "SAP",
    baseUrl: "https://sap-dev.corp.example.com",
    apiUrl: "https://sap-api-dev.corp.example.com/v2",
    featureFlags: [
      { name: "new-gl-posting", enabled: true, environment: "DEV" },
      { name: "parallel-run", enabled: false, environment: "DEV" },
      { name: "audit-trail-v2", enabled: true, environment: "TEST" },
    ],
    lastUpdated: daysAgo(1),
  },
  {
    application: "FIN",
    baseUrl: "https://fin-uat.corp.example.com",
    apiUrl: "https://fin-api-uat.corp.example.com",
    featureFlags: [
      { name: "batch-settlement", enabled: true, environment: "UAT" },
      { name: "real-time-ledger", enabled: false, environment: "UAT" },
      { name: "reg-reporting", enabled: true, environment: "PROD" },
    ],
    lastUpdated: daysAgo(0.5),
  },
  {
    application: "CRM",
    baseUrl: "https://crm-dev.corp.example.com",
    apiUrl: "https://crm-api-dev.corp.example.com/v4",
    featureFlags: [
      { name: "ai-lead-scoring", enabled: true, environment: "DEV" },
      { name: "omni-channel", enabled: true, environment: "DEV" },
      { name: "legacy-sync", enabled: false, environment: "TEST" },
    ],
    lastUpdated: daysAgo(2),
  },
];

export const enterpriseReleaseImpacts: EnterpriseReleaseImpact[] = [
  {
    releaseId: "tl-fin-uat",
    releaseName: "FIN UAT",
    prerequisites: [
      "FIN SIT 1 and SIT 2 sign-off complete",
      "SAP TEST environment at V2.0",
      "Change record CR-2026-1842 approved",
    ],
    conditions: ["queues paused", "events paused", "DB freezes", "apps down"],
    active: false,
  },
  {
    releaseId: "tl-fin-sit1",
    releaseName: "FIN SIT 1",
    prerequisites: ["SAP DEV promoted to TEST", "Test data refresh complete"],
    conditions: ["queues paused", "events paused"],
    active: true,
  },
  {
    releaseId: "tl-sec-patch",
    releaseName: "Security Patch Window",
    prerequisites: ["Emergency CAB approval", "Rollback runbook verified"],
    conditions: ["apps down", "customer support down"],
    active: false,
  },
];

export const ENTERPRISE_SYSTEMS = ["SAP", "Oracle", "FIN", "CRM"] as const;
