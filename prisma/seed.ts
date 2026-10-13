import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (existing) {
    console.log("Admin user already exists:", existing.email);
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@predictpoint.local",
      passwordHash,
      pointBalance: 0,
      isAdmin: true,
    },
  });
  console.log("Created admin user:", admin.email, "(password: admin123)");

  const demo = await prisma.user.create({
    data: {
      username: "demo",
      email: "demo@predictpoint.local",
      passwordHash: await bcrypt.hash("demo123", 12),
      pointBalance: 1000,
      isAdmin: false,
    },
  });
  console.log("Created demo user:", demo.email, "(1000 pts, password: demo123)");

  const market = await prisma.market.create({
    data: {
      title: "Will the demo user place a bet today?",
      description: "A sample Yes/No market to demonstrate the platform.",
      type: "YES_NO",
      createdById: admin.id,
      outcomes: {
        create: [
          { label: "Yes", poolTotal: 0 },
          { label: "No", poolTotal: 0 },
        ],
      },
    },
    include: { outcomes: true },
  });
  console.log("Created sample market:", market.title);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
