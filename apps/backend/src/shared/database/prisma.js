import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env.js";

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL no está configurada.");
}

const adapter = new PrismaMariaDb(env.databaseUrl, {
  database: new URL(env.databaseUrl).pathname.slice(1),
});

export const prisma = new PrismaClient({ adapter });
