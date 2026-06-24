import type { PrismaClient } from "@prisma/client";
import { releases } from "../lib/dummy-data";
import { startedAtForRollout } from "../lib/deployment-sim";

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000);

/**
 * Pre-load AI Command Center operational state for demos.
 * Scenario: v2.14.0 conditional Go + mid-canary deploy; v2.14.1 Go ready to ship.
 */
export async function seedLiveState(prisma: PrismaClient) {
  await prisma.releaseDecisionState.deleteMany();
  await prisma.deploymentState.deleteMany();
  await prisma.releaseHistoryEvent.deleteMany();
  await prisma.appNotificationRow.deleteMany();
  await prisma.agentPauseState.deleteMany();

  const rel2140 = releases.find((r) => r.id === "rel-v2140");
  if (!rel2140) return;

  const now = new Date();
  const deployStartedAt = startedAtForRollout(rel2140, 48, now);

  await prisma.releaseDecisionState.createMany({
    data: [
      {
        releaseId: "rel-v2140",
        decision: "Go",
        rationale: "Conditional Go — proceed with canary and auto-rollback guardrails.",
        decidedAt: hoursAgo(2),
        decidedBy: "Priya Sharma",
        overridden: true,
      },
      {
        releaseId: "rel-v2141",
        decision: "Go",
        rationale: "All gates green — low-risk mobile patch ready for production.",
        decidedAt: hoursAgo(8),
        decidedBy: "Nina Okonkwo",
        overridden: false,
      },
      {
        releaseId: "rel-v2135",
        decision: "No-Go",
        rationale: "Build #4468 still failing — hold until integration tests pass.",
        decidedAt: hoursAgo(4),
        decidedBy: "Alex Kim",
        overridden: false,
      },
    ],
  });

  await prisma.deploymentState.create({
    data: {
      releaseId: "rel-v2140",
      phase: "In Progress",
      startedAt: deployStartedAt,
    },
  });

  await prisma.releaseHistoryEvent.createMany({
    data: [
      {
        releaseId: "rel-v2140",
        timestamp: hoursAgo(3),
        actor: "Risk Agent",
        action: "Flagged payments-api canary — monitoring error rate during rollout",
        type: "agent",
        agent: "Risk Agent",
      },
      {
        releaseId: "rel-v2140",
        timestamp: hoursAgo(2),
        actor: "Priya Sharma",
        action: "Go decision recorded (override): Conditional Go — proceed with canary and auto-rollback guardrails.",
        type: "human",
      },
      {
        releaseId: "rel-v2140",
        timestamp: hoursAgo(1.8),
        actor: "Priya Sharma",
        action: "Started deployment to production (Argo CD)",
        type: "human",
      },
      {
        releaseId: "rel-v2141",
        timestamp: hoursAgo(8),
        actor: "Nina Okonkwo",
        action: "Go decision recorded for v2.14.1",
        type: "human",
      },
      {
        releaseId: "rel-v2135",
        timestamp: hoursAgo(4),
        actor: "Alex Kim",
        action: "No-Go decision recorded for v2.13.5 — awaiting build fix",
        type: "human",
      },
      {
        releaseId: "rel-v2135",
        timestamp: hoursAgo(6),
        actor: "Build Agent",
        action: "Build #4468 failed — 22 integration test failures",
        type: "agent",
        agent: "Build Agent",
      },
    ],
  });

  await prisma.appNotificationRow.createMany({
    data: [
      {
        timestamp: hoursAgo(1),
        title: "Security sign-off overdue",
        message: "v2.14.0 Security gate pending 72h — CAB review scheduled tomorrow",
        releaseId: "rel-v2140",
        read: false,
        type: "approval",
      },
      {
        timestamp: hoursAgo(2),
        title: "Build failed",
        message: "v2.13.5 build #4468 — 22 integration test failures",
        releaseId: "rel-v2135",
        read: false,
        type: "build",
      },
      {
        timestamp: hoursAgo(4),
        title: "CAB agenda updated",
        message: "Weekly Production CAB tomorrow — v2.14.0 and v2.14.1 on agenda",
        releaseId: "rel-v2140",
        read: false,
        type: "cab",
      },
      {
        timestamp: hoursAgo(2),
        title: "Go decision — v2.14.0",
        message: "Conditional Go — proceed with canary and auto-rollback guardrails.",
        releaseId: "rel-v2140",
        read: false,
        type: "decision",
      },
      {
        timestamp: hoursAgo(1.8),
        title: "Deployment started",
        message: "v2.14.0 rolling out to production",
        releaseId: "rel-v2140",
        read: false,
        type: "decision",
      },
      {
        timestamp: hoursAgo(8),
        title: "Go decision — v2.14.1",
        message: "All gates green — low-risk mobile patch ready for production.",
        releaseId: "rel-v2141",
        read: true,
        type: "decision",
      },
      {
        timestamp: hoursAgo(4),
        title: "No-Go decision — v2.13.5",
        message: "Build #4468 still failing — hold until integration tests pass.",
        releaseId: "rel-v2135",
        read: false,
        type: "decision",
      },
    ],
  });

  await prisma.agentPauseState.create({
    data: { agentId: "ag8", paused: true },
  });
}
