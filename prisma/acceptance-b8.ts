/**
 * B8 acceptance checks (run after db:seed):
 *   1. Cross-tenant isolation — Org A context sees zero Org B rows.
 *   2. Soft delete — deleting a Release keeps children, hides it from lists,
 *      still returns it with includeDeleted: true.
 *   3. cloneSystemDefaultsToOrg is idempotent.
 *
 * Run: npx tsx prisma/acceptance-b8.ts
 */
import { prisma } from "../lib/prisma";
import { runWithOrgContext } from "../lib/tenancy";
import { cloneSystemDefaultsToOrg } from "../lib/system-defaults";

const failures: string[] = [];

function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
}

async function main() {
  const demoOrg = await prisma.organization.findUnique({ where: { slug: "acme-corp-demo" } });
  if (!demoOrg) throw new Error("Demo org not found — run db:seed first");

  // ── Set up a throwaway second tenant with one release ──────────────────
  const orgB = await prisma.organization.upsert({
    where: { slug: "b8-test-org" },
    create: { name: "B8 Test Org", slug: "b8-test-org" },
    update: {},
  });
  const deptB = await runWithOrgContext({ organizationId: orgB.id }, () =>
    prisma.department.upsert({
      where: { organizationId_name: { organizationId: orgB.id, name: "B8 Dept" } },
      create: { organizationId: orgB.id, name: "B8 Dept", head: "B8 Head" },
      update: {},
    })
  );
  const releaseB = await runWithOrgContext({ organizationId: orgB.id }, () =>
    prisma.release.upsert({
      where: { organizationId_releaseCode: { organizationId: orgB.id, releaseCode: "B8-REL-1" } },
      create: {
        organizationId: orgB.id,
        releaseCode: "B8-REL-1",
        name: "Org B release",
        status: "Planned",
        releaseDate: new Date(),
        priority: "Low",
        impact: "Low",
        departmentId: deptB.id,
      },
      update: { deletedAt: null },
    })
  );

  // ── 1. Cross-tenant isolation ──────────────────────────────────────────
  const seenFromA = await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.release.findMany({ select: { organizationId: true } })
  );
  const leaked = seenFromA.filter((r) => r.organizationId !== demoOrg.id).length;
  check(
    "Org A list returns zero Org B rows",
    seenFromA.length > 0 && leaked === 0,
    `${seenFromA.length} rows, ${leaked} leaked`
  );

  const byIdFromA = await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.release.findUnique({ where: { id: releaseB.id } })
  );
  check("Org A cannot fetch Org B release by id", byIdFromA === null);

  let crossUpdateBlocked = false;
  try {
    await runWithOrgContext({ organizationId: demoOrg.id }, () =>
      prisma.release.update({ where: { id: releaseB.id }, data: { name: "hacked" } })
    );
  } catch {
    crossUpdateBlocked = true;
  }
  check("Org A cannot update Org B release by id", crossUpdateBlocked);

  // ── 2. Soft delete ─────────────────────────────────────────────────────
  const target = await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.release.findFirst({
      where: { risks: { some: {} }, approvals: { some: {} } },
      include: { _count: { select: { risks: true, approvals: true, drifts: true, bookings: true } } },
    })
  );
  if (!target) throw new Error("No demo release with risks+approvals found");
  const before = target._count;

  await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.release.delete({ where: { id: target.id } })
  );

  const gone = await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.release.findFirst({ where: { id: target.id } })
  );
  check("Deleted release absent from normal reads", gone === null);

  const stillThere = await runWithOrgContext(
    { organizationId: demoOrg.id, includeDeleted: true },
    () => prisma.release.findFirst({ where: { id: target.id } })
  );
  check(
    "Deleted release visible with includeDeleted",
    stillThere !== null && stillThere.deletedAt !== null,
    `deletedAt=${stillThere?.deletedAt?.toISOString()}`
  );

  const [risks, approvals, drifts, bookings] = await Promise.all([
    prisma.risk.count({ where: { releaseId: target.id } }),
    prisma.approval.count({ where: { releaseId: target.id } }),
    prisma.drift.count({ where: { releaseId: target.id } }),
    prisma.envBooking.count({ where: { releaseId: target.id } }),
  ]);
  check(
    "Children survive soft delete",
    risks === before.risks && approvals === before.approvals && drifts === before.drifts && bookings === before.bookings,
    `risks ${risks}/${before.risks}, approvals ${approvals}/${before.approvals}, drifts ${drifts}/${before.drifts}, bookings ${bookings}/${before.bookings}`
  );

  // restore
  await prisma.release.update({ where: { id: target.id }, data: { deletedAt: null } });

  // ── Gap-fix checks: relation-scoped create ownership ────────────────────
  const appA = await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.application.findFirst({ select: { id: true } })
  );
  if (!appA) throw new Error("No demo application found");

  let envCreateBlocked = false;
  try {
    // Org B tries to create an Environment hanging off Org A's application.
    await runWithOrgContext({ organizationId: orgB.id }, () =>
      prisma.environment.create({
        data: { applicationId: appA.id, name: "hack-env", type: "Dev", owner: "attacker" },
      })
    );
  } catch {
    envCreateBlocked = true;
  }
  check("Org B cannot create an Environment under Org A's application", envCreateBlocked);

  const releaseA = await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.release.findFirst({ select: { id: true } })
  );
  if (!releaseA) throw new Error("No demo release found");

  let auditEventCreateBlocked = false;
  try {
    // Org B tries to attach an audit event to Org A's release.
    await runWithOrgContext({ organizationId: orgB.id }, () =>
      prisma.releaseAuditEvent.create({
        data: { releaseId: releaseA.id, action: "status_change", actor: "attacker", detail: "hack" },
      })
    );
  } catch {
    auditEventCreateBlocked = true;
  }
  check("Org B cannot create a ReleaseAuditEvent on Org A's release", auditEventCreateBlocked);

  // ── Gap-fix checks: previously-unscoped legacy tables now isolate orgs ──
  await runWithOrgContext({ organizationId: orgB.id }, () =>
    prisma.appNotificationRow.create({
      data: { organizationId: orgB.id, title: "B8 test notif", message: "org B only", type: "decision" },
    })
  );
  const notifsFromA = await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.appNotificationRow.findMany({ where: { title: "B8 test notif" } })
  );
  check("Org A does not see Org B's AppNotificationRow", notifsFromA.length === 0);

  await runWithOrgContext({ organizationId: orgB.id }, () =>
    prisma.releaseDecisionState.create({
      data: { organizationId: orgB.id, releaseId: "rel-v2140", decision: "Go", decidedAt: new Date(), decidedBy: "b8-bot" },
    })
  );
  const decisionFromA = await runWithOrgContext({ organizationId: demoOrg.id }, () =>
    prisma.releaseDecisionState.findUnique({
      where: { organizationId_releaseId: { organizationId: demoOrg.id, releaseId: "rel-v2140" } },
    })
  );
  check(
    "Org A's copy of the shared demo release id 'rel-v2140' is independent of Org B's",
    decisionFromA === null || decisionFromA.decidedBy !== "b8-bot"
  );

  // ── 3. Clone idempotency ───────────────────────────────────────────────
  const run1 = await cloneSystemDefaultsToOrg(orgB.id);
  const run2 = await cloneSystemDefaultsToOrg(orgB.id);
  const cloned1 = run1.reduce((n, r) => n + r.cloned, 0);
  const cloned2 = run2.reduce((n, r) => n + r.cloned, 0);
  check("cloneSystemDefaultsToOrg populates a new org", cloned1 > 0, `${cloned1} rows`);
  check("Second clone run creates zero duplicates", cloned2 === 0, `${cloned2} rows`);

  // ── Cleanup the throwaway tenant (hard delete cascades) ────────────────
  await prisma.organization.delete({ where: { id: orgB.id } });

  if (failures.length > 0) {
    throw new Error(`B8 acceptance failed:\n- ${failures.join("\n- ")}`);
  }
  console.log("\nAll B8 acceptance checks passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
