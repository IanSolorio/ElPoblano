import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import prismaClientPackage from "@prisma/client";
import { env } from "../../config/env.js";

const { PrismaClient } = prismaClientPackage;

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL no está configurada.");
}

const databaseUrl = new URL(env.databaseUrl);
const localDatabaseHosts = new Set(["localhost", "127.0.0.1", "::1"]);

// MySQL 8 usa caching_sha2_password por defecto. En una conexión local sin
// TLS, el driver necesita recuperar la clave RSA para completar el login.
// Se limita deliberadamente a loopback para no relajar conexiones remotas.
if (localDatabaseHosts.has(databaseUrl.hostname)) {
  databaseUrl.searchParams.set("allowPublicKeyRetrieval", "true");
}

const adapter = new PrismaMariaDb(databaseUrl.toString(), {
  database: databaseUrl.pathname.slice(1),
});

export const prisma = new PrismaClient({ adapter });
