import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Exactly 2 users, no public signup route -- see docs/implementation-plan.md "Auth".
// Re-runnable: upserts by email so re-seeding (e.g. to rotate a password) is safe.
async function upsertUser(prefix: "SEED_USER_1" | "SEED_USER_2") {
  const email = process.env[`${prefix}_EMAIL`];
  const name = process.env[`${prefix}_NAME`];
  const password = process.env[`${prefix}_PASSWORD`];

  if (!email || !name || !password) {
    throw new Error(
      `Missing ${prefix}_EMAIL / ${prefix}_NAME / ${prefix}_PASSWORD in the environment.`
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  console.log(`Seeded user: ${email}`);
}

async function main() {
  await upsertUser("SEED_USER_1");
  await upsertUser("SEED_USER_2");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
