import argon2 from "argon2";
import { env } from "../src/config/env.js";
import { prisma } from "../src/shared/database/prisma.js";

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;
if (!env.databaseUrl || !email || !password || password.length < 10) {
  throw new Error("Configura SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD (mínimo 10 caracteres) en apps/backend/.env.");
}

const user = await prisma.user.upsert({
  where: { email },
  update: { role: "SUPER_ADMIN", active: true, deletedAt: null },
  create: {
    email, passwordHash: await argon2.hash(password, { type: argon2.argon2id }), role: "SUPER_ADMIN",
    firstName: process.env.SUPER_ADMIN_FIRST_NAME || "Administrador",
    lastName: process.env.SUPER_ADMIN_LAST_NAME || "Principal",
  },
});
await prisma.auditLog.create({ data: { userId: user.id, action: "SUPER_ADMIN_BOOTSTRAPPED", entity: "User", entityId: user.id } });
console.log(`Cuenta SUPER_ADMIN preparada: ${user.email}`);
await prisma.$disconnect();
