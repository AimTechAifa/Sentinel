import { prisma } from "../lib/prisma";
import { seedSystemMapping } from "../lib/seed-system-mapping";

// Matches DEMO_ORG.slug in seed.ts.
const DEMO_ORG_SLUG = "acme-corp-demo";

async function main() {
  const org = await prisma.organization.findUnique({ where: { slug: DEMO_ORG_SLUG } });
  if (!org) throw new Error(`Demo org "${DEMO_ORG_SLUG}" not found — run db:seed first`);
  await seedSystemMapping(prisma, org.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
